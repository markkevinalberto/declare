"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FolderOpen, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HANDLE_STORE, idbDelete, idbGet, idbPut } from "./media-store";

// The File System Access API isn't in TypeScript's default DOM lib yet
// (Chromium-only, not yet a cross-browser standard) — minimal local types
// for just what this component uses.
type PermissionMode = { mode?: "read" | "readwrite" };
type FSFileHandle = {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
};
type FSDirectoryHandle = {
  kind: "directory";
  name: string;
  queryPermission(desc?: PermissionMode): Promise<PermissionState>;
  requestPermission(desc?: PermissionMode): Promise<PermissionState>;
  values(): AsyncIterableIterator<FSFileHandle | FSDirectoryHandle>;
};

type MediaKind = "image" | "video";
type MediaItem = { name: string; url: string; kind: MediaKind };

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

// A folder with hundreds of (especially video) files can hold enough decoded
// blobs in memory to hang or crash the tab just from being opened. Cap how
// many get loaded — this is a background picker, not a file browser.
const MAX_FOLDER_ITEMS = 60;

const HANDLE_KEY = "backgroundFolder";
const HANDLE_SAVED_AT_KEY = "backgroundFolderSavedAt";
// Re-confirming a large local folder (esp. one full of videos) on every
// silent auto-reconnect is what made the presenter hang/feel unclickable —
// so the saved folder is only trusted for a few hours before we make the
// user explicitly reconnect (or pick a different one) again.
const HANDLE_TTL_MS = 5 * 60 * 60 * 1000;

async function saveHandle(handle: FSDirectoryHandle) {
  await idbPut(HANDLE_STORE, HANDLE_KEY, handle);
  await touchHandleSavedAt();
}

function touchHandleSavedAt() {
  return idbPut(HANDLE_STORE, HANDLE_SAVED_AT_KEY, Date.now());
}

async function loadHandle(): Promise<FSDirectoryHandle | null> {
  const handle = await idbGet<FSDirectoryHandle>(HANDLE_STORE, HANDLE_KEY);
  return handle ?? null;
}

async function isHandleExpired(): Promise<boolean> {
  const savedAt = await idbGet<number>(HANDLE_STORE, HANDLE_SAVED_AT_KEY);
  return typeof savedAt !== "number" || Date.now() - savedAt > HANDLE_TTL_MS;
}

async function clearSavedHandle() {
  await idbDelete(HANDLE_STORE, HANDLE_KEY);
  await idbDelete(HANDLE_STORE, HANDLE_SAVED_AT_KEY);
}

function getDirectoryPicker() {
  return (
    window as unknown as {
      showDirectoryPicker?: () => Promise<FSDirectoryHandle>;
    }
  ).showDirectoryPicker;
}

// Whether the browser supports folder browsing never changes after the page
// loads, but it isn't knowable during SSR (no `window`) — read it through
// useSyncExternalStore so the server/hydration render stays consistent and
// the real value only takes effect on the client, without an effect+setState
// round trip.
function subscribeNever() {
  return () => {};
}
function getSupportSnapshot() {
  return Boolean(getDirectoryPicker());
}
function getSupportServerSnapshot() {
  return false;
}

function MediaGrid({
  items,
  onPick,
}: {
  items: MediaItem[];
  onPick: (url: string, kind: MediaKind) => void;
}) {
  return (
    <div className="max-h-56 overflow-y-auto rounded-lg border bg-muted/20 p-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((item) => (
          <button
            key={item.url}
            type="button"
            onClick={() => onPick(item.url, item.kind)}
            className="group relative aspect-video overflow-hidden rounded border bg-black/5 hover:border-primary"
            title={item.name}
          >
            {item.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="" className="size-full object-cover" />
            ) : (
              <video
                src={item.url}
                muted
                preload="none"
                disablePictureInPicture
                disableRemotePlayback
                className="size-full object-cover"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * A one-click background picker backed by a local folder. Nothing in the
 * folder is ever uploaded anywhere.
 *
 * On Chromium browsers the folder is chosen once via the File System Access
 * API and remembered (with the browser's own permission prompt on return
 * visits). Other browsers fall back to a plain folder `<input>` — same
 * thumbnail grid, it just can't be remembered between visits.
 */
export function LocalMediaBin({
  onPick,
}: {
  onPick: (url: string, kind: MediaKind) => void;
}) {
  const supported = useSyncExternalStore(
    subscribeNever,
    getSupportSnapshot,
    getSupportServerSnapshot
  );
  const [items, setItems] = useState<MediaItem[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "needs-permission" | "expired"
  >("idle");
  const handleRef = useRef<FSDirectoryHandle | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);
  // Mutated in place (never reassigned) so the unmount cleanup below can
  // safely capture the array once.
  const objectUrlsRef = useRef<string[]>([]);
  // Bumped on every load/choose/reconnect/forget so an in-flight read of a
  // huge folder can't clobber a newer action (e.g. "forget this folder")
  // once it finally finishes.
  const loadTokenRef = useRef(0);

  function revokeAll() {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current.length = 0;
  }

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const loadFromHandle = useCallback(async (handle: FSDirectoryHandle) => {
    const myToken = ++loadTokenRef.current;
    setStatus("loading");

    const next: MediaItem[] = [];
    const localUrls: string[] = [];
    const stale = () => loadTokenRef.current !== myToken;
    const abandon = () => {
      for (const url of localUrls) URL.revokeObjectURL(url);
    };

    let count = 0;
    let hitCap = false;
    for await (const entry of handle.values()) {
      if (stale()) return abandon();
      if (entry.kind !== "file") continue;
      const kind: MediaKind | null = IMAGE_EXT.test(entry.name)
        ? "image"
        : VIDEO_EXT.test(entry.name)
          ? "video"
          : null;
      if (!kind) continue;
      if (next.length >= MAX_FOLDER_ITEMS) {
        hitCap = true;
        break;
      }
      const file = await entry.getFile();
      if (stale()) return abandon();
      const url = URL.createObjectURL(file);
      localUrls.push(url);
      next.push({ name: entry.name, url, kind });
      // Yield to the event loop every few files so a folder with dozens of
      // videos can't monopolize the main thread and make buttons (like
      // "Forget folder") feel unclickable while it's still reading.
      if (++count % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    if (stale()) return abandon();

    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current = localUrls;
    next.sort((a, b) => a.name.localeCompare(b.name));
    setItems(next);
    setTruncated(hitCap);
    setFolderName(handle.name);
    setStatus("idle");
  }, []);

  function loadFromFileList(files: FileList) {
    revokeAll();

    const next: MediaItem[] = [];
    let hitCap = false;
    for (const file of Array.from(files)) {
      const kind: MediaKind | null = IMAGE_EXT.test(file.name)
        ? "image"
        : VIDEO_EXT.test(file.name)
          ? "video"
          : null;
      if (!kind) continue;
      if (next.length >= MAX_FOLDER_ITEMS) {
        hitCap = true;
        break;
      }
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      next.push({ name: file.webkitRelativePath || file.name, url, kind });
    }
    next.sort((a, b) => a.name.localeCompare(b.name));
    setItems(next);
    setTruncated(hitCap);
    const relativePath = files[0]?.webkitRelativePath;
    setFolderName(relativePath ? relativePath.split("/")[0] : "Selected folder");
    setStatus("idle");
  }

  useEffect(() => {
    if (!supported) return;
    loadHandle().then(async (handle) => {
      if (!handle) return;
      handleRef.current = handle;
      if (await isHandleExpired()) {
        setFolderName(handle.name);
        setStatus("expired");
        return;
      }
      const perm = await handle.queryPermission({ mode: "read" });
      if (perm === "granted") {
        loadFromHandle(handle);
      } else {
        setFolderName(handle.name);
        setStatus("needs-permission");
      }
    });
  }, [supported, loadFromHandle]);

  async function chooseFolder() {
    const picker = getDirectoryPicker();
    if (!picker) return;
    try {
      const handle = await picker();
      handleRef.current = handle;
      await saveHandle(handle);
      await loadFromHandle(handle);
    } catch {
      // User cancelled the picker — nothing to do.
    }
  }

  async function reconnect() {
    if (!handleRef.current) return;
    const perm = await handleRef.current.requestPermission({ mode: "read" });
    if (perm === "granted") {
      await touchHandleSavedAt();
      loadFromHandle(handleRef.current);
    }
  }

  // Fully forgets the saved folder — invalidates any read still in flight
  // (so it can't overwrite this once it finishes), clears everything shown,
  // and removes it from IndexedDB so it's never auto-loaded again.
  async function forgetFolder() {
    loadTokenRef.current++;
    revokeAll();
    handleRef.current = null;
    setItems([]);
    setTruncated(false);
    setFolderName(null);
    setStatus("idle");
    await clearSavedHandle();
  }

  if (!supported) {
    return (
      <div className="grid gap-1.5">
        <input
          type="file"
          multiple
          className="hidden"
          ref={(el) => {
            fallbackInputRef.current = el;
            if (el) el.webkitdirectory = true;
          }}
          onChange={(event) => {
            const files = event.target.files;
            if (files && files.length > 0) loadFromFileList(files);
            // Reset so re-choosing the same folder still fires a change.
            event.target.value = "";
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <Label className="min-w-0 truncate text-xs">
            {folderName ? `Folder: ${folderName}` : "Background folder"}
          </Label>
          {folderName ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 shrink-0 px-2 text-[11px]"
              onClick={() => fallbackInputRef.current?.click()}
            >
              <FolderOpen className="size-3" /> Change
            </Button>
          ) : null}
        </div>
        {items.length > 0 ? (
          <MediaGrid items={items} onPick={onPick} />
        ) : folderName ? (
          <p className="text-[11px] text-muted-foreground">
            No images or videos found in this folder.
          </p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fallbackInputRef.current?.click()}
          >
            <FolderOpen /> Choose a folder on this computer
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground">
          This browser can&rsquo;t remember the folder between visits — Chrome
          or Edge can.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="min-w-0 truncate text-xs">
          {folderName ? `Folder: ${folderName}` : "Background folder"}
        </Label>
        <div className="flex shrink-0 items-center gap-1">
          {folderName ? (
            <Button
              size="icon-sm"
              variant="ghost"
              className="size-6"
              onClick={forgetFolder}
              aria-label="Forget this folder"
              title="Forget this folder — stop remembering it, even if it's still loading"
            >
              <Trash2 className="size-3" />
            </Button>
          ) : null}
          {status === "needs-permission" || status === "expired" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-6 shrink-0 px-2 text-[11px]"
              onClick={reconnect}
            >
              <RefreshCw className="size-3" /> Reconnect
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 shrink-0 px-2 text-[11px]"
              onClick={chooseFolder}
            >
              <FolderOpen className="size-3" /> {folderName ? "Change" : "Choose folder"}
            </Button>
          )}
        </div>
      </div>

      {status === "loading" ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : status === "needs-permission" ? (
        <p className="text-[11px] text-muted-foreground">
          Click &ldquo;Reconnect&rdquo; to let this page read that folder
          again — the browser resets folder access each visit for privacy.
        </p>
      ) : status === "expired" ? (
        <p className="text-[11px] text-muted-foreground">
          It&rsquo;s been a few hours since you picked this folder — click
          &ldquo;Reconnect&rdquo; to keep using it, or choose a different one.
        </p>
      ) : items.length > 0 ? (
        <>
          <MediaGrid items={items} onPick={onPick} />
          {truncated ? (
            <p className="text-[11px] text-muted-foreground">
              Showing the first {MAX_FOLDER_ITEMS} files — this folder has
              more. Consider splitting it into smaller folders.
            </p>
          ) : null}
        </>
      ) : folderName ? (
        <p className="text-[11px] text-muted-foreground">
          No images or videos found in this folder.
        </p>
      ) : (
        <Button variant="outline" size="sm" onClick={chooseFolder}>
          <FolderOpen /> Choose a folder on this computer
        </Button>
      )}
    </div>
  );
}
