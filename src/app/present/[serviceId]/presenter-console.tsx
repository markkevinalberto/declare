"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Baseline,
  Bold,
  BookOpenText,
  BookUp,
  CalendarClock,
  Eraser,
  FileText,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  MonitorPlay,
  MonitorUp,
  Music,
  Pause,
  Pencil,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  SeparatorHorizontal,
  Square,
  SquareSlash,
  Timer,
  Trash2,
  Type,
  Volume2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DeclareMark } from "@/components/brand/declare-mark";
import { BIBLE_TRANSLATIONS, parseBibleXml } from "@/lib/bible";
import { parseLyricsToSlides } from "@/lib/lyric-slides";
import {
  FONT_OPTIONS,
  normalizeSongFormat,
  resolveSongFormat,
  type ProjectionSettings,
  type SongProjectionFormat,
} from "@/lib/projection";
import {
  ensureRichHtml,
  splitRichHtmlIntoSlides,
  stripHtmlToText,
} from "@/lib/rich-text";
import { SongDialog } from "@/app/(app)/songs/song-dialog";
import type { Song } from "@/app/(app)/songs/songs-view";
import { deletePlanItem } from "@/app/(app)/services/[id]/actions";
import { SongPickerPopover } from "@/app/(app)/services/[id]/song-picker-popover";
import type { MediaFileMeta } from "@/lib/media";
import {
  addBiblePlanItem,
  addContentPlanItem,
  addMediaPlanItem,
  lookupBiblePassage,
  saveBiblePlanItemFormat,
  saveBibleVerseOverride,
  saveContentText,
  saveMediaConfig,
  savePlanItemTitle,
  saveProjectionSettings,
  saveSongProjectionFormat,
  type BiblePassage,
} from "./actions";
import { LocalMediaBin } from "./local-media-bin";
import { CountdownText } from "./live-widgets";
import {
  DisplayPreferencesPopover,
  openOnPreferredScreen,
  useDisplayPreferences,
} from "./display-preferences";
import { eventMatchesCombo, normalizeMatchText, useHotkeySettings } from "./hotkeys";
import { HotkeySettingsPopover } from "./hotkeys-settings";
import { loadPlanItemFiles, savePlanItemFiles } from "./media-store";
import { PptxImportDialog } from "./pptx-import-dialog";
import { SlideVisual, type MediaSize } from "./slide-visual";

export type PresentItem =
  | { planItemId: string; kind: "song"; song: Song }
  | {
      planItemId: string;
      kind: "bible";
      reference: string;
      translation: string;
      translationLabel: string | null;
      versesOverride: { verse: number; text: string }[] | null;
      projectionFormat: Record<string, unknown> | null;
    }
  | {
      planItemId: string;
      kind: "content";
      /** Explicit override title, blank when not renamed — the display
       * title then falls back to a preview of the content text. */
      title: string;
      text: string;
      projectionFormat: Record<string, unknown> | null;
    }
  | {
      planItemId: string;
      kind: "media";
      title: string;
      files: MediaFileMeta[];
    }
  | { planItemId: string; kind: "header" | "note" | "item"; title: string };

/** A media file attached on THIS machine, already resolved to a blob URL. */
type LocalMediaFile = { name: string; url: string; kind: "image" | "video" };

type Slide = {
  isTitleCard: boolean;
  label: string | null;
  lines: string[];
  reference: string | null;
  media?: { kind: "image" | "video"; url: string } | null;
  /** A content slide's rich body (bullets, numbering, alignment) as HTML. */
  richHtml?: string | null;
};

type QueueGroup = {
  planItemId: string;
  kind: "song" | "bible" | "content" | "media";
  title: string;
  subtitle: string | null;
  start: number;
  slides: Slide[];
  /** Key into the format map — a song's id (shared across services) or a
   * bible/content plan item's own id (formatting isn't reusable like a song is). */
  formatKey: string;
  song?: Song;
  hasOverride?: boolean;
};

type BoardRow =
  | { rowKind: "group"; group: QueueGroup }
  | {
      rowKind: "label";
      planItemId: string;
      itemKind: "header" | "note" | "item";
      title: string;
    };

type PassageState = BiblePassage | "loading" | "error";

/** Playback snapshot of the video on a media slide (projector or preview). */
type MediaPlaybackStatus = {
  paused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
};

function formatMediaTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const TEXT_COLORS = ["#ffffff", "#ffe55c", "#8ed1ff", "#a5f3a5"];

// The monitor panel's remembered width lives in localStorage — read through
// useSyncExternalStore so the very first client render matches the server
// (which has no localStorage) instead of causing a hydration mismatch.
const MONITOR_WIDTH_KEY = "presenter-monitor-width";
const MONITOR_WIDTH_EVENT = "presenter-monitor-width-change";

function getMonitorWidthSnapshot() {
  const saved = Number(localStorage.getItem(MONITOR_WIDTH_KEY));
  return saved >= 180 && saved <= 640 ? saved : 256;
}
function getMonitorWidthServerSnapshot() {
  return 256;
}
function subscribeMonitorWidth(callback: () => void) {
  window.addEventListener(MONITOR_WIDTH_EVENT, callback);
  return () => window.removeEventListener(MONITOR_WIDTH_EVENT, callback);
}
function persistMonitorWidth(width: number) {
  localStorage.setItem(MONITOR_WIDTH_KEY, String(width));
  window.dispatchEvent(new Event(MONITOR_WIDTH_EVENT));
}

// Same pattern as the monitor panel's width, for the schedule board.
const SCHEDULE_WIDTH_KEY = "presenter-schedule-width";
const SCHEDULE_WIDTH_EVENT = "presenter-schedule-width-change";

function getScheduleWidthSnapshot() {
  const saved = Number(localStorage.getItem(SCHEDULE_WIDTH_KEY));
  return saved >= 200 && saved <= 480 ? saved : 256;
}
function getScheduleWidthServerSnapshot() {
  return 256;
}
function subscribeScheduleWidth(callback: () => void) {
  window.addEventListener(SCHEDULE_WIDTH_EVENT, callback);
  return () => window.removeEventListener(SCHEDULE_WIDTH_EVENT, callback);
}
function persistScheduleWidth(width: number) {
  localStorage.setItem(SCHEDULE_WIDTH_KEY, String(width));
  window.dispatchEvent(new Event(SCHEDULE_WIDTH_EVENT));
}

// Whether this service has ever gone live on this machine — keyed per
// service so a presenter reload mid-service doesn't blank an already-live
// projector, but a fresh service starts blank until the first explicit Go
// Live press. Deliberately NOT part of the BroadcastChannel state (it's a
// local gate on what postState sends, not something a projector reports).
const GONE_LIVE_EVENT = "presenter-gone-live-change";
function goneLiveKey(serviceId: string) {
  return `presenter-gone-live:${serviceId}`;
}
function getGoneLiveServerSnapshot() {
  return false;
}
function subscribeGoneLive(callback: () => void) {
  window.addEventListener(GONE_LIVE_EVENT, callback);
  return () => window.removeEventListener(GONE_LIVE_EVENT, callback);
}
function markGoneLive(serviceId: string) {
  localStorage.setItem(goneLiveKey(serviceId), "1");
  window.dispatchEvent(new Event(GONE_LIVE_EVENT));
}

// Persists which slide is actually live, per service, so a presenter reload
// mid-service restores it instead of resetting to slide 0 — which would
// otherwise get broadcast to the live projector on the next unrelated
// interaction (toggling Blank, adjusting volume, anything at all).
function liveIndexKey(serviceId: string) {
  return `presenter-live-index:${serviceId}`;
}
function getPersistedLiveIndex(serviceId: string) {
  const n = Number(localStorage.getItem(liveIndexKey(serviceId)));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function persistLiveIndex(serviceId: string, index: number) {
  localStorage.setItem(liveIndexKey(serviceId), String(index));
}

const kindLabel = (kind: QueueGroup["kind"]) =>
  kind === "song"
    ? "song"
    : kind === "bible"
      ? "verse"
      : kind === "media"
        ? "media"
        : "slide";

/** Builds the projectable slide queue and the full schedule-board row list. */
function buildQueue(
  items: PresentItem[],
  biblePassages: Record<string, PassageState>,
  itemMedia: Record<string, LocalMediaFile[]>
): { groups: QueueGroup[]; flat: Slide[]; boardRows: BoardRow[] } {
  const groups: QueueGroup[] = [];
  const flat: Slide[] = [];
  const boardRows: BoardRow[] = [];

  for (const item of items) {
    if (item.kind === "song") {
      const { song } = item;
      const slides: Slide[] = [
        {
          isTitleCard: true,
          label: null,
          reference: null,
          lines: [song.title, ...(song.artist ? [song.artist] : [])],
        },
        ...parseLyricsToSlides(song.lyrics ?? "").map((s) => ({
          ...s,
          isTitleCard: false,
          reference: null,
        })),
      ];
      const group: QueueGroup = {
        planItemId: item.planItemId,
        kind: "song",
        title: song.title,
        subtitle: song.artist,
        start: flat.length,
        slides,
        formatKey: song.id,
        song,
      };
      groups.push(group);
      flat.push(...slides);
      boardRows.push({ rowKind: "group", group });
    } else if (item.kind === "bible") {
      const translationLabel = item.translationLabel ?? item.translation;
      const referenceCaption = `${item.reference} (${translationLabel})`;
      const hasOverride = Boolean(item.versesOverride?.length);
      const sourceVerses = hasOverride
        ? item.versesOverride!
        : (() => {
            const resolved = biblePassages[item.planItemId];
            return resolved && resolved !== "loading" && resolved !== "error"
              ? resolved.verses
              : [];
          })();
      const slides: Slide[] = sourceVerses.map((v) => ({
        isTitleCard: false,
        label: `Verse ${v.verse}`,
        reference: referenceCaption,
        lines: [`${v.verse} ${v.text}`],
      }));
      const group: QueueGroup = {
        planItemId: item.planItemId,
        kind: "bible",
        title: item.reference,
        subtitle: translationLabel,
        start: flat.length,
        slides,
        formatKey: item.planItemId,
        hasOverride,
      };
      groups.push(group);
      flat.push(...slides);
      boardRows.push({ rowKind: "group", group });
    } else if (item.kind === "media") {
      const local = itemMedia[item.planItemId];
      let photoNumber = 0;
      const slides: Slide[] = (local ?? []).map((f) => ({
        isTitleCard: false,
        label: f.kind === "video" ? "Video" : `Photo ${++photoNumber}`,
        reference: null,
        lines: [],
        media: { kind: f.kind, url: f.url },
      }));
      const group: QueueGroup = {
        planItemId: item.planItemId,
        kind: "media",
        title: item.title.trim() || "Media",
        subtitle: local
          ? `${local.length} ${local.length === 1 ? "file" : "files"}`
          : item.files.length > 0
            ? "Files not on this device"
            : "Empty — click the pencil",
        start: flat.length,
        slides,
        formatKey: item.planItemId,
      };
      groups.push(group);
      flat.push(...slides);
      boardRows.push({ rowKind: "group", group });
    } else if (item.kind === "content") {
      const html = ensureRichHtml(item.text);
      const preview = stripHtmlToText(html);
      const parts = splitRichHtmlIntoSlides(html);
      const slides: Slide[] = parts.map((partHtml, i) => ({
        isTitleCard: false,
        label: parts.length > 1 ? `Slide ${i + 1}` : "Slide",
        reference: null,
        lines: [],
        richHtml: partHtml,
      }));
      const group: QueueGroup = {
        planItemId: item.planItemId,
        kind: "content",
        title: item.title.trim() || preview || "Content slide",
        subtitle: parts.length > 1 ? `${parts.length} slides` : null,
        start: flat.length,
        slides,
        formatKey: item.planItemId,
      };
      groups.push(group);
      flat.push(...slides);
      boardRows.push({ rowKind: "group", group });
    } else {
      boardRows.push({
        rowKind: "label",
        planItemId: item.planItemId,
        itemKind: item.kind,
        title: item.title,
      });
    }
  }

  return { groups, flat, boardRows };
}

function groupForSlideIndex(groups: QueueGroup[], index: number) {
  return groups.findLast((g) => index >= g.start);
}

/** Reads every media item's locally-attached files into blob URLs. */
async function loadMediaForItems(
  items: PresentItem[]
): Promise<Record<string, LocalMediaFile[]>> {
  const next: Record<string, LocalMediaFile[]> = {};
  for (const item of items) {
    if (item.kind !== "media") continue;
    const files = await loadPlanItemFiles(item.planItemId).catch(() => null);
    if (!files) continue;
    next[item.planItemId] = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? "video" : "image",
    }));
  }
  return next;
}

/** Resolves what the active slide's content and effective style should be. */
function resolveActiveSlide({
  activeIndex,
  settings,
  itemFormats,
  groups,
  flat,
}: {
  activeIndex: number;
  settings: ProjectionSettings;
  itemFormats: Record<string, SongProjectionFormat>;
  groups: QueueGroup[];
  flat: Slide[];
}): {
  reference: string | null;
  lines: string[];
  media: { kind: "image" | "video"; url: string } | null;
  richHtml: string | null;
  settings: ProjectionSettings;
} {
  const slide = flat[activeIndex];
  const group = groupForSlideIndex(groups, activeIndex);
  const resolvedSettings = group
    ? resolveSongFormat(settings, itemFormats[group.formatKey])
    : settings;
  return {
    reference: slide?.reference ?? null,
    richHtml: slide?.richHtml ?? null,
    lines: slide?.lines ?? [],
    media: slide?.media ?? null,
    settings: resolvedSettings,
  };
}

function BibleVerseEditDialog({
  planItemId,
  title,
  initialText,
  onSaved,
}: {
  planItemId: string;
  title: string;
  initialText: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  async function commit(nextText: string, successMessage: string) {
    setSaving(true);
    try {
      const result = await saveBibleVerseOverride(planItemId, nextText);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setText(initialText);
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpenText className="size-4 text-primary" />
            Edit “{title}”
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Changes apply to this service plan only — the original bible (built-in
          or uploaded) is never changed. Keep each verse on its own line,
          starting with its number; anything else you type is added to the
          verse above it.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="font-mono text-sm"
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => commit("", "Reverted to the original wording")}
          >
            Reset to original
          </Button>
          <Button
            disabled={saving}
            onClick={() => commit(text, "Verse text updated for this service")}
          >
            {saving ? <Loader2 className="animate-spin" /> : null} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="icon-sm"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {children}
    </Button>
  );
}

function ContentSlideEditDialog({
  planItemId,
  initialText,
  onSaved,
}: {
  planItemId: string;
  initialText: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, TextAlign.configure({ types: ["paragraph", "heading"] })],
    content: ensureRichHtml(initialText),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "projected-rich-text min-h-40 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    try {
      const result = await saveContentText(planItemId, editor.getHTML());
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Content slide updated");
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) editor?.commands.setContent(ensureRichHtml(initialText));
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Edit content slide
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Type anything — an announcement, a welcome message, a quote. Put{" "}
          <span className="font-mono">--</span> on its own line (or use the
          slide-break button) to split this into multiple slides.
        </p>
        {editor ? (
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 p-1">
              <ToolbarToggle
                label="Bullet list"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List />
              </ToolbarToggle>
              <ToolbarToggle
                label="Numbered list"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered />
              </ToolbarToggle>
              <div className="mx-1 h-5 w-px bg-border" />
              <ToolbarToggle
                label="Insert slide break"
                active={false}
                onClick={() =>
                  editor.chain().focus().insertContent("<p>--</p>").run()
                }
              >
                <SeparatorHorizontal />
              </ToolbarToggle>
              <div className="mx-1 h-5 w-px bg-border" />
              <ToolbarToggle
                label="Align left"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
              >
                <AlignLeft />
              </ToolbarToggle>
              <ToolbarToggle
                label="Align center"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
              >
                <AlignCenter />
              </ToolbarToggle>
              <ToolbarToggle
                label="Align right"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
              >
                <AlignRight />
              </ToolbarToggle>
            </div>
            <EditorContent editor={editor} />
          </div>
        ) : null}
        <DialogFooter>
          <Button disabled={saving || !editor} onClick={handleSave}>
            {saving ? <Loader2 className="animate-spin" /> : null} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaEditDialog({
  planItemId,
  title,
  configuredFiles,
  localFiles,
  onSaved,
}: {
  planItemId: string;
  title: string;
  configuredFiles: MediaFileMeta[];
  localFiles: LocalMediaFile[] | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList) {
    const files = Array.from(list).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length === 0) {
      toast.error("Choose image or video files.");
      return;
    }
    setSaving(true);
    try {
      await savePlanItemFiles(planItemId, files);
      const result = await saveMediaConfig(planItemId, {
        files: files.map((f) => ({
          name: f.name,
          type: f.type.startsWith("video/")
            ? ("video" as const)
            : ("image" as const),
        })),
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        files.length === 1 ? "Media attached" : `${files.length} files attached`
      );
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Could not store the files in this browser.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Pick photos for a slideshow (each becomes a slide) or a video. The
          files stay on this computer — nothing is uploaded — so attach them
          on the machine that runs the projector.
        </p>

        {localFiles && localFiles.length > 0 ? (
          <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/20 p-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              {localFiles.map((file) => (
                <div
                  key={file.url}
                  className="relative aspect-video overflow-hidden rounded border bg-black/5"
                  title={file.name}
                >
                  {file.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt="" className="size-full object-cover" />
                  ) : (
                    <video
                      src={file.url}
                      muted
                      disablePictureInPicture
                      disableRemotePlayback
                      className="size-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : configuredFiles.length > 0 ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            These files were attached on another device — choose the same
            files here to show them from this machine:
            <ul className="mt-1.5 list-inside list-disc">
              {configuredFiles.map((file, i) => (
                <li key={i} className="truncate">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={() => inputRef.current?.click()}
          >
            {saving ? <Loader2 className="animate-spin" /> : <ImageIcon />}
            {localFiles || configuredFiles.length > 0
              ? "Replace with other files"
              : "Choose photos or a video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PresenterConsole({
  service,
  items,
  orgId,
  isScheduler,
  initialSettings,
  bibles,
}: {
  service: { id: string; title: string };
  items: PresentItem[];
  orgId: string;
  isScheduler: boolean;
  initialSettings: ProjectionSettings;
  bibles: { id: string; name: string }[];
}) {
  const router = useRouter();

  const [biblePassages, setBiblePassages] = useState<
    Record<string, PassageState>
  >({});
  const fetchingBibleRef = useRef<Set<string>>(new Set());

  // Media files attached on this machine, loaded from the browser's local
  // store and resolved to blob URLs. Keyed by plan item id; an item missing
  // here has no files on this device (they may exist on another machine).
  // Bumping mediaVersion re-reads the store (after the edit dialog saves).
  const [itemMedia, setItemMedia] = useState<Record<string, LocalMediaFile[]>>(
    {}
  );
  const [mediaVersion, setMediaVersion] = useState(0);
  const mediaUrlsRef = useRef<string[]>([]);
  // `items` gets a brand-new array identity on every router.refresh() —
  // including ones triggered by unrelated edits (song lyrics, a bible verse
  // override) — even when no media item actually changed. Reading it through
  // a ref, keyed instead on the stable list of media plan-item ids, means
  // this effect only re-reads local files when a media item is actually
  // added/removed (id list changes) or explicitly saved (mediaVersion
  // bumps) — not on every unrelated refresh, which was minting fresh blob
  // URLs and revoking the ones a projector video was actively playing.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const mediaItemIdsKey = items
    .filter((i) => i.kind === "media")
    .map((i) => i.planItemId)
    .sort()
    .join(",");

  useEffect(() => {
    void mediaItemIdsKey;
    void mediaVersion;
    let cancelled = false;
    loadMediaForItems(itemsRef.current).then((next) => {
      const nextUrls = Object.values(next).flatMap((files) =>
        files.map((f) => f.url)
      );
      if (cancelled) {
        for (const url of nextUrls) URL.revokeObjectURL(url);
        return;
      }
      for (const url of mediaUrlsRef.current) URL.revokeObjectURL(url);
      mediaUrlsRef.current = nextUrls;
      setItemMedia(next);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaItemIdsKey, mediaVersion]);

  useEffect(() => {
    return () => {
      for (const url of mediaUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  const { groups, flat, boardRows } = useMemo(
    () => buildQueue(items, biblePassages, itemMedia),
    [items, biblePassages, itemMedia]
  );

  // Resolve verse text for bible plan items that don't have an edited
  // override and don't have fetched text yet.
  useEffect(() => {
    for (const item of items) {
      if (item.kind !== "bible") continue;
      if (item.versesOverride?.length) continue;
      if (biblePassages[item.planItemId]) continue;
      if (fetchingBibleRef.current.has(item.planItemId)) continue;
      fetchingBibleRef.current.add(item.planItemId);
      lookupBiblePassage(item.reference, item.translation).then((result) => {
        setBiblePassages((prev) => ({
          ...prev,
          [item.planItemId]: result.passage ?? "error",
        }));
      });
    }
  }, [items, biblePassages]);

  // Restored from localStorage (not just 0) so a presenter reload
  // mid-service picks up where the live projector actually is, rather than
  // resetting to slide 0 and later broadcasting that on the next unrelated
  // interaction.
  const [activeIndex, setActiveIndex] = useState(() =>
    getPersistedLiveIndex(service.id)
  );
  // The operator navigates `previewIndex` — what's shown in the main slide
  // panel — independently of `activeIndex`, which is what's actually live
  // on the projector/stage. They're pushed together by goLive(), or
  // automatically while navigating within the group that's already live
  // (see goTo below) so advancing through a live song's lyrics doesn't
  // require a Go Live press per line.
  const [previewIndex, setPreviewIndex] = useState(() =>
    getPersistedLiveIndex(service.id)
  );
  useEffect(() => {
    persistLiveIndex(service.id, activeIndex);
  }, [service.id, activeIndex]);
  const getGoneLiveSnapshot = useCallback(
    () => localStorage.getItem(goneLiveKey(service.id)) === "1",
    [service.id]
  );
  const hasGoneLive = useSyncExternalStore(
    subscribeGoneLive,
    getGoneLiveSnapshot,
    getGoneLiveServerSnapshot
  );
  const scheduleWidth = useSyncExternalStore(
    subscribeScheduleWidth,
    getScheduleWidthSnapshot,
    getScheduleWidthServerSnapshot
  );
  const scheduleResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [blank, setBlank] = useState(false);
  const [clearText, setClearText] = useState(false);
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<"schedule" | "bible">("schedule");
  const displayPrefs = useDisplayPreferences();
  const hotkeySettings = useHotkeySettings();
  // Below md, the schedule/slides/monitor columns can't fit side by side —
  // this is a phone screen, not the operator's laptop — so only one shows
  // at a time, switched via the tab bar rendered just for that width.
  const [mobileTab, setMobileTab] = useState<"schedule" | "slides" | "monitor">(
    "slides"
  );
  const monitorWidth = useSyncExternalStore(
    subscribeMonitorWidth,
    getMonitorWidthSnapshot,
    getMonitorWidthServerSnapshot
  );
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [settings, setSettings] = useState<ProjectionSettings>(initialSettings);
  const [itemFormats, setItemFormats] = useState<
    Record<string, SongProjectionFormat>
  >(() => {
    const entries: [string, SongProjectionFormat][] = [];
    for (const item of items) {
      if (item.kind === "song") {
        entries.push([item.song.id, normalizeSongFormat(item.song.projection_format)]);
      } else if (item.kind === "bible" || item.kind === "content") {
        entries.push([item.planItemId, normalizeSongFormat(item.projectionFormat)]);
      }
    }
    return Object.fromEntries(entries);
  });

  const [bibleRef, setBibleRef] = useState("");
  const [translation, setTranslation] = useState("web");
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const [looking, startLookup] = useTransition();
  const [adding, setAdding] = useState(false);
  const [addingContent, setAddingContent] = useState(false);
  const [addingMedia, setAddingMedia] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [bibleUploadPct, setBibleUploadPct] = useState<number | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastPongRef = useRef(0);

  // Player state for video media slides: the projector reports playback
  // status over the channel (authoritative when connected); the muted
  // confidence-monitor video is the fallback source so the controls still
  // work before the projector is opened.
  const monitorVideoRef = useRef<HTMLVideoElement | null>(null);
  const monitorMediaCleanupRef = useRef<(() => void) | null>(null);
  const [localMediaStatus, setLocalMediaStatus] =
    useState<MediaPlaybackStatus | null>(null);
  const [remoteMediaStatus, setRemoteMediaStatus] =
    useState<MediaPlaybackStatus | null>(null);
  const [desiredVolume, setDesiredVolume] = useState(1);

  // Pre-service countdown: shown instead of the active slide's text on
  // whichever screens are selected. `endsAt` is a fixed epoch ms so every
  // screen ticks it locally in sync, with no ongoing broadcast needed.
  const [countdownEndsAt, setCountdownEndsAt] = useState<number | null>(null);
  const [countdownLabel, setCountdownLabel] = useState("");
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [countdownOnProjector, setCountdownOnProjector] = useState(false);

  // Scrolling announcement ticker, aimed at the projector, the stage
  // display, or both. Kept separate from the typed text so toggling it off
  // doesn't erase what was written — same pattern as Blank/Clear vs. content.
  const [crawlText, setCrawlText] = useState("");
  const [crawlEnabled, setCrawlEnabled] = useState(false);
  const [crawlTarget, setCrawlTarget] = useState<"both" | "projector" | "stage">(
    "both"
  );

  const handleMonitorMediaVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      monitorMediaCleanupRef.current?.();
      monitorMediaCleanupRef.current = null;
      monitorVideoRef.current = el;
      if (!el) {
        setLocalMediaStatus(null);
        return;
      }
      const update = () => {
        setLocalMediaStatus({
          paused: el.paused,
          currentTime: el.currentTime,
          duration: Number.isFinite(el.duration) ? el.duration : 0,
          volume: el.volume,
        });
      };
      const events = [
        "play",
        "pause",
        "timeupdate",
        "volumechange",
        "loadedmetadata",
        "durationchange",
        "ended",
      ] as const;
      for (const event of events) el.addEventListener(event, update);
      update();
      monitorMediaCleanupRef.current = () => {
        for (const event of events) el.removeEventListener(event, update);
      };
    },
    []
  );

  // Sizes the confidence-monitor box to the active media's own aspect ratio
  // (a fixed 16:9 frame left tall portrait photos/videos as a thin sliver).
  // Clamped so an extreme ratio can't blow out the sidebar's layout.
  const [monitorMediaAspect, setMonitorMediaAspect] = useState<number | null>(
    null
  );
  const handleMonitorMediaSize = useCallback((size: MediaSize | null) => {
    setMonitorMediaAspect(
      size && size.width > 0 && size.height > 0
        ? Math.min(2.4, Math.max(0.5, size.width / size.height))
        : null
    );
  }, []);

  const postMediaCommand = useCallback(
    (action: "play" | "pause" | "stop" | "seek" | "volume", value?: number) => {
      channelRef.current?.postMessage({ type: "media-control", action, value });
      // Mirror on the confidence monitor so the preview matches the screen.
      // Volume is projector-only — the monitor always stays muted.
      const el = monitorVideoRef.current;
      if (!el) return;
      if (action === "play") {
        el.play().catch(() => {});
      } else if (action === "pause") {
        el.pause();
      } else if (action === "stop") {
        el.pause();
        el.currentTime = 0;
      } else if (action === "seek" && typeof value === "number") {
        el.currentTime = Math.max(0, value);
      }
    },
    []
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formatSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bibleFileRef = useRef<HTMLInputElement>(null);

  const stateRef = useRef({
    activeIndex,
    blank,
    clearText,
    settings,
    itemFormats,
    desiredVolume,
    countdownEndsAt,
    countdownLabel,
    countdownOnProjector,
    crawlText,
    crawlEnabled,
    crawlTarget,
    hasGoneLive,
  });
  useEffect(() => {
    stateRef.current = {
      activeIndex,
      blank,
      clearText,
      settings,
      itemFormats,
      desiredVolume,
      countdownEndsAt,
      countdownLabel,
      countdownOnProjector,
      crawlText,
      crawlEnabled,
      crawlTarget,
      hasGoneLive,
    };
  }, [
    activeIndex,
    blank,
    clearText,
    settings,
    itemFormats,
    desiredVolume,
    countdownEndsAt,
    countdownLabel,
    countdownOnProjector,
    crawlText,
    crawlEnabled,
    crawlTarget,
    hasGoneLive,
  ]);

  const postState = useCallback(() => {
    const {
      activeIndex,
      blank,
      clearText,
      settings,
      itemFormats,
      desiredVolume,
      countdownEndsAt,
      countdownLabel,
      countdownOnProjector,
      crawlText,
      crawlEnabled,
      crawlTarget,
      hasGoneLive,
    } = stateRef.current;
    const resolved = resolveActiveSlide({
      activeIndex,
      settings,
      itemFormats,
      groups,
      flat,
    });
    channelRef.current?.postMessage({
      type: "state",
      // Nothing has been intentionally pushed live yet — keep the output
      // blank rather than flashing whatever slide 0 happens to be the
      // moment a projector connects.
      blank: hasGoneLive ? blank : true,
      clearText,
      volume: desiredVolume,
      countdown:
        countdownEndsAt !== null
          ? { endsAt: countdownEndsAt, label: countdownLabel, onProjector: countdownOnProjector }
          : null,
      crawl:
        crawlEnabled && crawlText.trim()
          ? { text: crawlText.trim(), target: crawlTarget }
          : null,
      ...resolved,
      ...(hasGoneLive ? null : { lines: [], media: null, richHtml: null }),
    });
  }, [groups, flat]);

  const livePreview = useMemo(
    () => ({
      blank: hasGoneLive ? blank : true,
      clearText,
      countdown:
        countdownEndsAt !== null
          ? { endsAt: countdownEndsAt, label: countdownLabel }
          : null,
      crawl: crawlEnabled && crawlText.trim() ? { text: crawlText.trim() } : null,
      ...resolveActiveSlide({ activeIndex, settings, itemFormats, groups, flat }),
      ...(hasGoneLive ? null : { lines: [], media: null, richHtml: null }),
    }),
    [
      activeIndex,
      blank,
      clearText,
      settings,
      itemFormats,
      groups,
      flat,
      countdownEndsAt,
      countdownLabel,
      crawlText,
      crawlEnabled,
      hasGoneLive,
    ]
  );

  useEffect(() => {
    const channel = new BroadcastChannel(`projection:${service.id}`);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg?.type === "hello" || msg?.type === "pong") {
        lastPongRef.current = Date.now();
        setConnected(true);
        if (msg.type === "hello") postState();
      } else if (msg?.type === "media-status") {
        setRemoteMediaStatus(
          msg.gone
            ? null
            : {
                paused: Boolean(msg.paused),
                currentTime: Number(msg.currentTime) || 0,
                duration: Number(msg.duration) || 0,
                volume: Number(msg.volume) || 0,
              }
        );
      }
    };

    const ping = setInterval(() => {
      channel.postMessage({ type: "ping" });
      if (Date.now() - lastPongRef.current > 8000) setConnected(false);
    }, 3000);

    return () => {
      clearInterval(ping);
      channel.close();
      channelRef.current = null;
    };
  }, [service.id, postState]);

  // Broadcasts on every genuine user-driven change — but NOT on mount. On a
  // presenter reload, this effect would otherwise fire immediately with
  // fresh default state (activeIndex 0, empty flat before bible/media data
  // has loaded), snapping a live projector back to slide 0/black. A ref for
  // postState keeps this un-dependent on `groups`/`flat` too, so it doesn't
  // ALSO re-fire once async data finishes loading post-reload — only real
  // user actions (or an explicit "hello" handshake, handled separately
  // above) broadcast state.
  const postStateRef = useRef(postState);
  useEffect(() => {
    postStateRef.current = postState;
  }, [postState]);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    postStateRef.current();
  }, [
    activeIndex,
    blank,
    clearText,
    settings,
    itemFormats,
    desiredVolume,
    countdownEndsAt,
    countdownLabel,
    countdownOnProjector,
    crawlText,
    crawlEnabled,
    crawlTarget,
    hasGoneLive,
  ]);

  function updateSettings(patch: Partial<ProjectionSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (isScheduler) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          saveProjectionSettings(next).then((result) => {
            if (result?.error) toast.error(result.error);
          });
        }, 800);
      }
      return next;
    });
  }

  // Navigates the PREVIEW only — it takes an explicit goLive() to push that
  // onto the projector, except when navigating within the group that's
  // already live, where it stays in lockstep automatically (advancing
  // through a live song's lyrics shouldn't need a Go Live press per line).
  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(flat.length - 1, index));
      // A no-op nav (arrow past the last slide, re-clicking the previewed
      // tile) mustn't clear remoteMediaStatus: the slide isn't actually
      // changing, so the projector never reports fresh media-status — a
      // paused video fires no events — and the player bar would silently
      // fall back to the confidence monitor's drifted time/volume until the
      // next real command.
      if (clamped === previewIndex) return;
      setPreviewIndex(clamped);

      const liveGroup = groupForSlideIndex(groups, activeIndex);
      const targetGroup = groupForSlideIndex(groups, clamped);
      const stayingWithinLiveGroup =
        hasGoneLive &&
        liveGroup &&
        targetGroup &&
        liveGroup.planItemId === targetGroup.planItemId;

      if (stayingWithinLiveGroup && clamped !== activeIndex) {
        setActiveIndex(clamped);
        // The projector will report the new slide's video (if any) afresh —
        // don't show the previous video's time/duration in the meantime.
        setRemoteMediaStatus(null);
      }
    },
    [flat.length, previewIndex, activeIndex, groups, hasGoneLive]
  );

  // Pushes the previewed slide onto the projector/stage.
  const goLive = useCallback(() => {
    markGoneLive(service.id);
    if (previewIndex === activeIndex) return;
    setActiveIndex(previewIndex);
    setRemoteMediaStatus(null);
  }, [previewIndex, activeIndex, service.id]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const eventTarget = e.target as HTMLElement | null;
      if (
        eventTarget &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(eventTarget.tagName) ||
          eventTarget.isContentEditable)
      ) {
        return;
      }
      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === " " ||
        e.key === "PageDown"
      ) {
        e.preventDefault();
        goTo(previewIndex + 1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(previewIndex - 1);
        return;
      }

      if (eventMatchesCombo(e, hotkeySettings.global.goLive)) {
        // Enter defaults to this hotkey, but Enter is also the browser's
        // native "activate this button" key — nearly every control here
        // (Blank, Delete, Add Content, …) is a real <button> that stays
        // focused after a click, so without this check, clicking Blank and
        // then pressing Enter would silently push the preview live instead
        // of doing what the operator actually intended.
        if (eventTarget?.tagName === "BUTTON") return;
        e.preventDefault();
        goLive();
        return;
      }

      if (eventMatchesCombo(e, hotkeySettings.global.blank)) {
        e.preventDefault();
        setBlank((b) => !b);
        return;
      }
      if (eventMatchesCombo(e, hotkeySettings.global.clearText)) {
        e.preventDefault();
        setClearText((c) => !c);
        return;
      }
      if (eventMatchesCombo(e, hotkeySettings.global.openProjector)) {
        e.preventDefault();
        openOnPreferredScreen(
          "projector",
          `/present/${service.id}/screen`,
          `projection-${service.id}`,
          displayPrefs.projector
        );
        return;
      }
      if (eventMatchesCombo(e, hotkeySettings.global.openStage)) {
        e.preventDefault();
        openOnPreferredScreen(
          "stage",
          `/present/${service.id}/stage`,
          `stage-${service.id}`,
          displayPrefs.stage
        );
        return;
      }

      // Jump-to-song-section shortcuts only make sense within whatever
      // song/verse is currently previewed — section labels ("Verse 1",
      // "Chorus", …) are freeform text from the lyrics, matched
      // case/punctuation-insensitively against each binding's saved text.
      const group = groupForSlideIndex(groups, previewIndex);
      if (!group) return;
      for (const section of hotkeySettings.sections) {
        if (!section.combo.key || !eventMatchesCombo(e, section.combo)) {
          continue;
        }
        const wanted = normalizeMatchText(section.matchText);
        if (!wanted) return;
        const slideIndex = group.slides.findIndex(
          (s) => s.label && normalizeMatchText(s.label) === wanted
        );
        if (slideIndex !== -1) {
          e.preventDefault();
          goTo(group.start + slideIndex);
        }
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, goLive, previewIndex, groups, hotkeySettings, service.id, displayPrefs]);

  function startResizingMonitor(e: ReactPointerEvent) {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startWidth: monitorWidth };

    function onMove(moveEvent: PointerEvent) {
      if (!resizeRef.current) return;
      const delta = resizeRef.current.startX - moveEvent.clientX;
      const next = Math.max(
        180,
        Math.min(640, resizeRef.current.startWidth + delta)
      );
      persistMonitorWidth(next);
    }
    function onUp() {
      resizeRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startResizingSchedule(e: ReactPointerEvent) {
    e.preventDefault();
    scheduleResizeRef.current = { startX: e.clientX, startWidth: scheduleWidth };

    function onMove(moveEvent: PointerEvent) {
      if (!scheduleResizeRef.current) return;
      // The schedule board sits on the left, so dragging right (positive
      // delta) grows it — opposite sign convention from the monitor panel
      // on the right.
      const delta = moveEvent.clientX - scheduleResizeRef.current.startX;
      const next = Math.max(
        200,
        Math.min(480, scheduleResizeRef.current.startWidth + delta)
      );
      persistScheduleWidth(next);
    }
    function onUp() {
      scheduleResizeRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startRename(planItemId: string, currentTitle: string) {
    setRenamingId(planItemId);
    setRenameDraft(currentTitle);
  }

  function commitRename() {
    const planItemId = renamingId;
    setRenamingId(null);
    if (!planItemId) return;
    savePlanItemTitle(planItemId, renameDraft).then((result) => {
      if (result?.error) toast.error(result.error);
      else router.refresh();
    });
  }

  function startCountdown() {
    setCountdownEndsAt(Date.now() + countdownMinutes * 60_000);
  }

  function updateItemFormat(
    formatKey: string,
    kind: "song" | "bible" | "content",
    patch: SongProjectionFormat | null
  ) {
    setItemFormats((prev) => {
      const next = {
        ...prev,
        [formatKey]: patch === null ? {} : { ...prev[formatKey], ...patch },
      };
      if (formatSaveTimerRef.current) clearTimeout(formatSaveTimerRef.current);
      formatSaveTimerRef.current = setTimeout(() => {
        const save = kind === "song" ? saveSongProjectionFormat : saveBiblePlanItemFormat;
        save(formatKey, next[formatKey]).then((result) => {
          if (result?.error) toast.error(result.error);
        });
      }, 800);
      return next;
    });
  }

  function runLookup() {
    setBibleError(null);
    setPassage(null);
    startLookup(async () => {
      const result = await lookupBiblePassage(bibleRef, translation);
      if (result.error) {
        setBibleError(result.error);
      } else if (result.passage) {
        setPassage(result.passage);
      }
    });
  }

  async function handleAddToSchedule() {
    if (!passage) return;
    setAdding(true);
    try {
      const result = await addBiblePlanItem(
        service.id,
        passage.reference,
        translation,
        passage.translation
      );
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Added “${passage.reference}” to the service plan`);
      setPassage(null);
      setBibleRef("");
      setView("schedule");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleAddContentSlide() {
    setAddingContent(true);
    try {
      const result = await addContentPlanItem(service.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Content slide added — click the pencil to edit it");
      router.refresh();
    } finally {
      setAddingContent(false);
    }
  }

  async function handleDeletePlanItem(planItemId: string) {
    setDeletingItemId(planItemId);
    try {
      await deletePlanItem(planItemId, service.id);
      toast.success("Removed from the service plan");
      router.refresh();
    } finally {
      setDeletingItemId(null);
    }
  }

  async function handleAddMediaSlide() {
    setAddingMedia(true);
    try {
      const result = await addMediaPlanItem(service.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Media item added — click the pencil to choose files");
      router.refresh();
    } finally {
      setAddingMedia(false);
    }
  }

  async function handleBibleUpload(file: File) {
    const xml = await file.text();
    const parsed = parseBibleXml(xml);
    if (!parsed) {
      toast.error(
        "Couldn't read that file — supported formats: Zefania, OSIS, USFX, or <bible><book><chapter><verse> XML."
      );
      return;
    }

    setBibleUploadPct(0);
    const supabase = createClient();
    const { data: bible, error } = await supabase
      .from("bibles")
      .insert({ org_id: orgId, name: parsed.name })
      .select("id")
      .single();
    if (error || !bible) {
      toast.error("Could not create the bible.");
      setBibleUploadPct(null);
      return;
    }

    const CHUNK = 1000;
    for (let i = 0; i < parsed.verses.length; i += CHUNK) {
      const rows = parsed.verses
        .slice(i, i + CHUNK)
        .map((v) => ({ bible_id: bible.id, ...v }));
      const { error: verseError } = await supabase
        .from("bible_verses")
        .insert(rows);
      if (verseError) {
        toast.error("Upload failed partway — removing the partial bible.");
        await supabase.from("bibles").delete().eq("id", bible.id);
        setBibleUploadPct(null);
        return;
      }
      setBibleUploadPct(
        Math.round(((i + rows.length) / parsed.verses.length) * 100)
      );
    }

    setBibleUploadPct(null);
    setTranslation(bible.id);
    toast.success(`“${parsed.name}” uploaded — ${parsed.verses.length.toLocaleString()} verses`);
    router.refresh();
  }

  // The main slide panel and "Format text" popover reflect what's being
  // PREVIEWED — what the operator is looking at and about to send live —
  // while `liveGroup` (below) tracks what's actually on the projector, for
  // the separate live/preview indicators on tiles and schedule rows.
  const previewGroup = groupForSlideIndex(groups, previewIndex);
  const liveGroup = hasGoneLive ? groupForSlideIndex(groups, activeIndex) : null;
  // Narrowed once here because property narrowing (previewGroup.kind)
  // doesn't survive into JSX event-handler closures. Media has no text to format.
  const activeFormatKind =
    previewGroup && previewGroup.kind !== "media" ? previewGroup.kind : null;
  const activeSlideMedia = flat[activeIndex]?.media ?? null;
  const mediaStatus =
    connected && remoteMediaStatus ? remoteMediaStatus : localMediaStatus;
  const displayVolume =
    connected && remoteMediaStatus ? remoteMediaStatus.volume : desiredVolume;
  const formatKey = previewGroup?.formatKey ?? null;
  const itemFormat = formatKey ? itemFormats[formatKey] ?? {} : {};
  const effectiveFormat = resolveSongFormat(settings, itemFormat);
  const hasCustomFormat = formatKey
    ? Object.keys(itemFormats[formatKey] ?? {}).length > 0
    : false;
  // What to show in place of slides while a previewed group has none yet —
  // "Loading…" is only accurate for a bible passage still in flight; a
  // media item with no local files, or one that failed to load, needs its
  // own message (matching the sidebar's own subtitle logic for that row).
  const emptyGroupMessage = (() => {
    if (!previewGroup) return "Loading verses…";
    if (previewGroup.kind === "media") {
      const mediaItem = items.find(
        (i): i is Extract<PresentItem, { kind: "media" }> =>
          i.kind === "media" && i.planItemId === previewGroup.planItemId
      );
      return mediaItem && mediaItem.files.length > 0
        ? "These files aren't on this device — click the pencil above to attach them here."
        : "No images or videos yet — click the pencil above to add some.";
    }
    if (previewGroup.kind === "bible") {
      return biblePassages[previewGroup.planItemId] === "error"
        ? "Couldn't load this passage — check the reference."
        : "Loading verses…";
    }
    return "Loading verses…";
  })();

  return (
    <div className="flex h-svh flex-col bg-background">
      {/* Slim, static title bar — never scrolls, always shows what this
          window is (mirrors the browser tab's own "{service} — Declare"). */}
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b bg-muted/30 px-3">
        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-gradient-to-br from-primary to-chart-2">
          <DeclareMark className="size-2.5 text-primary-foreground" />
        </span>
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{service.title}</span>
          {" — Declare"}
        </span>
      </div>
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<a href={`/services/${service.id}`} />}
        >
          <ArrowLeft /> Back
        </Button>
        <span className="min-w-0 flex-1" />
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
            connected ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              connected ? "bg-green-500" : "bg-muted-foreground/50"
            )}
          />
          {connected ? "Projector connected" : "Projector not open"}
        </span>

        <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </span>
          <span className="max-w-32 truncate">
            {previewGroup
              ? `${previewGroup.title}${flat[previewIndex]?.label ? ` — ${flat[previewIndex]?.label}` : ""}`
              : "—"}
          </span>
        </div>
        <Button
          size="sm"
          variant="destructive"
          disabled={previewIndex === activeIndex && hasGoneLive}
          onClick={goLive}
          title="Push the preview to the live output (Enter)"
        >
          <Radio /> Go live
        </Button>

        {isScheduler && previewGroup && activeFormatKind && formatKey ? (
          <Popover>
            <PopoverTrigger
              render={
                <Button variant={hasCustomFormat ? "default" : "outline"} size="sm" />
              }
            >
              <Type /> Format text
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="flex items-center justify-between">
                <PopoverTitle className="truncate">
                  “{previewGroup.title}” text
                </PopoverTitle>
                {hasCustomFormat ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={() => updateItemFormat(formatKey, activeFormatKind, null)}
                  >
                    <RotateCcw /> Reset
                  </Button>
                ) : null}
              </div>
              <p className="-mt-1 text-[11px] text-muted-foreground">
                Overrides the projection theme for this {kindLabel(previewGroup.kind)} only.
              </p>

              <div className="grid gap-1.5">
                <Label className="text-xs">Font</Label>
                <Select
                  value={effectiveFormat.fontFamily}
                  onValueChange={(value) =>
                    updateItemFormat(formatKey, activeFormatKind, {
                      fontFamily: value as string,
                    })
                  }
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue>
                      {FONT_OPTIONS.find(
                        (f) => f.value === effectiveFormat.fontFamily
                      )?.label ?? "Choose a font"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>
                          {font.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">
                  Text size — {Math.round(effectiveFormat.fontScale * 100)}%
                </Label>
                <input
                  type="range"
                  min={60}
                  max={160}
                  step={5}
                  value={Math.round(effectiveFormat.fontScale * 100)}
                  onChange={(e) =>
                    updateItemFormat(formatKey, activeFormatKind, {
                      fontScale: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full accent-primary"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Text color</Label>
                <div className="flex items-center gap-1.5">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        updateItemFormat(formatKey, activeFormatKind, { textColor: color })
                      }
                      className={cn(
                        "size-7 rounded-full border-2",
                        effectiveFormat.textColor === color
                          ? "border-primary"
                          : "border-border"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Text color ${color}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={effectiveFormat.textColor}
                    onChange={(e) =>
                      updateItemFormat(formatKey, activeFormatKind, {
                        textColor: e.target.value,
                      })
                    }
                    className="size-7 cursor-pointer rounded border bg-transparent"
                    aria-label="Custom text color"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Bold className="size-3.5" /> Bold
                </Label>
                <Switch
                  checked={effectiveFormat.bold}
                  onCheckedChange={(checked) =>
                    updateItemFormat(formatKey, activeFormatKind, { bold: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Italic className="size-3.5" /> Italic
                </Label>
                <Switch
                  checked={effectiveFormat.italic}
                  onCheckedChange={(checked) =>
                    updateItemFormat(formatKey, activeFormatKind, { italic: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">All caps</Label>
                <Switch
                  checked={effectiveFormat.allCaps}
                  onCheckedChange={(checked) =>
                    updateItemFormat(formatKey, activeFormatKind, { allCaps: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Text shadow</Label>
                <Switch
                  checked={effectiveFormat.shadow}
                  onCheckedChange={(checked) =>
                    updateItemFormat(formatKey, activeFormatKind, { shadow: checked })
                  }
                />
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">Text stroke (outline)</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={effectiveFormat.strokeColor}
                      disabled={!effectiveFormat.stroke}
                      onChange={(e) =>
                        updateItemFormat(formatKey, activeFormatKind, {
                          strokeColor: e.target.value,
                        })
                      }
                      className="size-7 cursor-pointer rounded border bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Stroke color"
                    />
                    <Switch
                      checked={effectiveFormat.stroke}
                      onCheckedChange={(checked) =>
                        updateItemFormat(formatKey, activeFormatKind, { stroke: checked })
                      }
                    />
                  </div>
                </div>
                {effectiveFormat.stroke ? (
                  <div className="flex items-center gap-2">
                    <Label className="shrink-0 text-[11px] text-muted-foreground">
                      Thickness
                    </Label>
                    <input
                      type="range"
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={effectiveFormat.strokeWidth * 100}
                      onChange={(e) =>
                        updateItemFormat(formatKey, activeFormatKind, {
                          strokeWidth: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-primary"
                    />
                    <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground">
                      {(effectiveFormat.strokeWidth * 100).toFixed(1)}%
                    </span>
                  </div>
                ) : null}
              </div>

              <p
                className="rounded-md border bg-muted/40 p-2.5 text-center leading-tight"
                style={{
                  fontFamily: effectiveFormat.fontFamily,
                  color: effectiveFormat.textColor,
                  fontWeight: effectiveFormat.bold ? 800 : 600,
                  fontStyle: effectiveFormat.italic ? "italic" : undefined,
                  textTransform: effectiveFormat.allCaps ? "uppercase" : undefined,
                  textShadow: effectiveFormat.shadow
                    ? "0 2px 10px rgba(0,0,0,0.6)"
                    : undefined,
                  WebkitTextStroke: effectiveFormat.stroke
                    ? `${effectiveFormat.strokeWidth}em ${effectiveFormat.strokeColor}`
                    : undefined,
                  fontSize: `${effectiveFormat.fontScale * 1.1}rem`,
                }}
              >
                <Baseline className="mb-1 inline size-3 text-muted-foreground" />{" "}
                Preview text
              </p>
            </PopoverContent>
          </Popover>
        ) : null}

        <Button
          variant={clearText ? "default" : "outline"}
          size="sm"
          onClick={() => setClearText((c) => !c)}
          title="Hide just the text — the background keeps playing"
        >
          <Eraser /> Clear
        </Button>
        <Button
          variant={blank ? "default" : "outline"}
          size="sm"
          onClick={() => setBlank((b) => !b)}
          title="Blank the live output (Ctrl+B)"
        >
          <SquareSlash /> Blank
        </Button>
        {displayPrefs.projector ? (
          // A screen was explicitly assigned — this only happens via the
          // Displays popover on a capable desktop browser, so a scripted
          // popup here is safe (never reached by mobile's default path).
          <Button
            size="sm"
            onClick={() =>
              openOnPreferredScreen(
                "projector",
                `/present/${service.id}/screen`,
                `projection-${service.id}`,
                displayPrefs.projector
              )
            }
          >
            <MonitorUp /> Open projector
          </Button>
        ) : (
          <a
            href={`/present/${service.id}/screen`}
            target={`projection-${service.id}`}
            rel="noopener"
            className={buttonVariants({ size: "sm" })}
          >
            <MonitorUp /> Open projector
          </a>
        )}
        {displayPrefs.stage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openOnPreferredScreen(
                "stage",
                `/present/${service.id}/stage`,
                `stage-${service.id}`,
                displayPrefs.stage
              )
            }
          >
            <MonitorPlay /> Open stage display
          </Button>
        ) : (
          <a
            href={`/present/${service.id}/stage`}
            target={`stage-${service.id}`}
            rel="noopener"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <MonitorPlay /> Open stage display
          </a>
        )}
        <DisplayPreferencesPopover />
        <HotkeySettingsPopover />
      </header>

      <div className="flex gap-1 border-b p-1.5 md:hidden">
        <Button
          variant={mobileTab === "schedule" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileTab("schedule")}
        >
          Schedule
        </Button>
        <Button
          variant={mobileTab === "slides" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileTab("slides")}
        >
          Slides
        </Button>
        <Button
          variant={mobileTab === "monitor" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileTab("monitor")}
        >
          Monitor
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "shrink-0 flex-col border-r md:flex md:w-[var(--schedule-width)]",
            mobileTab === "schedule" ? "flex w-full" : "hidden"
          )}
          style={{ "--schedule-width": `${scheduleWidth}px` } as CSSProperties}
        >
          <div className="flex gap-1 border-b p-1.5">
            <Button
              variant={view === "schedule" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setView("schedule")}
            >
              <CalendarClock /> Schedule
            </Button>
            <Button
              variant={view === "bible" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setView("bible")}
            >
              <BookOpenText /> Bible
            </Button>
          </div>

          {view === "schedule" ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {boardRows.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    This service plan is empty — add songs or Bible verses to
                    build the schedule.
                  </p>
                ) : (
                  <div className="grid gap-1">
                    {boardRows.map((row) => {
                      if (row.rowKind === "label") {
                        return (
                          <div
                            key={row.planItemId}
                            className={cn(
                              "flex items-center gap-1 rounded-md pr-1 hover:bg-muted",
                              row.itemKind === "header" && "mt-2 first:mt-0"
                            )}
                          >
                            <div
                              className={cn(
                                "min-w-0 flex-1 px-2 py-1.5 text-xs",
                                row.itemKind === "header"
                                  ? "font-semibold uppercase tracking-wide text-muted-foreground"
                                  : "italic text-muted-foreground"
                              )}
                            >
                              {row.title}
                            </div>
                            {isScheduler ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={deletingItemId === row.planItemId}
                                onClick={() => handleDeletePlanItem(row.planItemId)}
                                aria-label="Delete"
                                title="Delete"
                              >
                                {deletingItemId === row.planItemId ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Trash2 />
                                )}
                              </Button>
                            ) : null}
                          </div>
                        );
                      }
                      const { group } = row;
                      const isPreviewedGroup =
                        previewGroup?.planItemId === group.planItemId;
                      const isLiveGroup = liveGroup?.planItemId === group.planItemId;
                      const canRename =
                        isScheduler &&
                        (group.kind === "content" || group.kind === "media");
                      const isRenaming = renamingId === group.planItemId;
                      const loadingBible =
                        group.kind === "bible" &&
                        !group.hasOverride &&
                        biblePassages[group.planItemId] === "loading";
                      const errorBible =
                        group.kind === "bible" &&
                        !group.hasOverride &&
                        biblePassages[group.planItemId] === "error";
                      const hasFormat =
                        Object.keys(itemFormats[group.formatKey] ?? {}).length > 0;
                      return (
                        <div
                          key={group.planItemId}
                          className={cn(
                            "flex items-center gap-1 rounded-md pr-1 hover:bg-muted",
                            isPreviewedGroup && "bg-accent text-accent-foreground"
                          )}
                        >
                          {isRenaming ? (
                            <Input
                              autoFocus
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  commitRename();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  setRenamingId(null);
                                }
                              }}
                              className="mx-1 my-1 h-7 min-w-0 flex-1 text-sm"
                            />
                          ) : (
                            <button
                              type="button"
                              disabled={group.slides.length === 0}
                              onClick={() => {
                                goTo(group.start);
                                // On a phone, picking an item is done from
                                // here — switch straight to its slide tiles
                                // rather than leaving the operator staring at
                                // the same list they just tapped.
                                setMobileTab("slides");
                              }}
                              onDoubleClick={() => {
                                if (canRename) startRename(group.planItemId, group.title);
                              }}
                              className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {group.kind === "bible" ? (
                                <BookOpenText className="size-3.5 shrink-0 text-muted-foreground" />
                              ) : group.kind === "content" ? (
                                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                              ) : group.kind === "media" ? (
                                <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                              ) : null}
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 truncate font-medium">
                                  {isLiveGroup ? (
                                    <span className="flex shrink-0 items-center gap-0.5 rounded bg-destructive px-1 py-px text-[9px] font-bold uppercase tracking-wide text-destructive-foreground">
                                      Live
                                    </span>
                                  ) : null}
                                  <span className="min-w-0 truncate">{group.title}</span>
                                  {hasFormat ? (
                                    <Type
                                      className="size-3 shrink-0 text-primary"
                                      aria-label="Custom text format"
                                    />
                                  ) : null}
                                  {group.hasOverride ? (
                                    <Pencil
                                      className="size-3 shrink-0 text-primary"
                                      aria-label="Edited wording"
                                    />
                                  ) : null}
                                </span>
                                {group.subtitle ? (
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {loadingBible
                                      ? "Loading verses…"
                                      : errorBible
                                        ? "Couldn't load this passage"
                                        : group.subtitle}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          )}
                          {isScheduler && group.kind === "song" && group.song ? (
                            <SongDialog
                              song={group.song}
                              onSaved={() => router.refresh()}
                            />
                          ) : null}
                          {isScheduler && group.kind === "bible" && group.slides.length > 0 ? (
                            <BibleVerseEditDialog
                              planItemId={group.planItemId}
                              title={group.title}
                              initialText={group.slides.map((s) => s.lines[0]).join("\n")}
                              onSaved={() => router.refresh()}
                            />
                          ) : null}
                          {isScheduler && group.kind === "content" ? (
                            <ContentSlideEditDialog
                              planItemId={group.planItemId}
                              initialText={
                                (items.find(
                                  (i) =>
                                    i.planItemId === group.planItemId &&
                                    i.kind === "content"
                                ) as Extract<PresentItem, { kind: "content" }> | undefined)
                                  ?.text ?? ""
                              }
                              onSaved={() => router.refresh()}
                            />
                          ) : null}
                          {isScheduler && group.kind === "media" ? (
                            <MediaEditDialog
                              planItemId={group.planItemId}
                              title={group.title}
                              configuredFiles={
                                (items.find(
                                  (i) =>
                                    i.planItemId === group.planItemId &&
                                    i.kind === "media"
                                ) as Extract<PresentItem, { kind: "media" }> | undefined)
                                  ?.files ?? []
                              }
                              localFiles={itemMedia[group.planItemId] ?? null}
                              onSaved={() => {
                                router.refresh();
                                setMediaVersion((v) => v + 1);
                              }}
                            />
                          ) : null}
                          {isScheduler ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={deletingItemId === group.planItemId}
                              onClick={() => handleDeletePlanItem(group.planItemId)}
                              aria-label="Delete"
                              title="Delete"
                            >
                              {deletingItemId === group.planItemId ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Trash2 />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {isScheduler ? (
                <div className="flex flex-wrap gap-1.5 border-t p-1.5">
                  <div className="min-w-[6rem] flex-1 [&>button]:w-full">
                    <SongPickerPopover
                      serviceId={service.id}
                      onAdded={() => router.refresh()}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-[6rem] flex-1"
                    disabled={addingContent}
                    onClick={handleAddContentSlide}
                  >
                    {addingContent ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Plus />
                    )}
                    Content slide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-[6rem] flex-1"
                    disabled={addingMedia}
                    onClick={handleAddMediaSlide}
                  >
                    {addingMedia ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ImageIcon />
                    )}
                    Media
                  </Button>
                  <PptxImportDialog
                    serviceId={service.id}
                    onImported={() => router.refresh()}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-2 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={bibleRef}
                  onChange={(e) => setBibleRef(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runLookup();
                  }}
                  placeholder="John 14:1-4"
                  className="pl-8"
                />
              </div>
              <Select
                value={translation}
                onValueChange={(value) => setTranslation(value as string)}
              >
                <SelectTrigger className="w-full min-w-0" size="sm">
                  <SelectValue className="truncate">
                    {bibles.find((b) => b.id === translation)?.name ??
                      BIBLE_TRANSLATIONS.find((t) => t.id === translation)
                        ?.label ??
                      "Choose a bible"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {bibles.map((bible) => (
                    <SelectItem key={bible.id} value={bible.id}>
                      {bible.name}
                    </SelectItem>
                  ))}
                  {BIBLE_TRANSLATIONS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={runLookup} disabled={looking}>
                {looking ? <Loader2 className="animate-spin" /> : <Search />}
                Look up
              </Button>
              {bibleError ? (
                <p className="text-xs text-destructive">{bibleError}</p>
              ) : null}
              {passage && isScheduler ? (
                <Button size="sm" variant="outline" onClick={handleAddToSchedule} disabled={adding}>
                  {adding ? <Loader2 className="animate-spin" /> : <Plus />}
                  Add to service plan
                </Button>
              ) : null}
              {isScheduler ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bibleUploadPct !== null}
                    onClick={() => bibleFileRef.current?.click()}
                  >
                    {bibleUploadPct !== null ? (
                      <>
                        <Loader2 className="animate-spin" /> {bibleUploadPct}%
                      </>
                    ) : (
                      <>
                        <BookUp /> Upload XML bible
                      </>
                    )}
                  </Button>
                  <input
                    ref={bibleFileRef}
                    type="file"
                    accept=".xml,text/xml,application/xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBibleUpload(file);
                      e.target.value = "";
                    }}
                  />
                </>
              ) : null}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Online lookup uses free public-domain translations. Upload an
                XML bible (Zefania, OSIS, USFX, or Beblia format) to use any
                other version, e.g. in your own language.{" "}
                {isScheduler
                  ? "Add a looked-up passage to the service plan to project it."
                  : ""}
              </p>
            </div>
          )}
        </aside>

        <div
          onPointerDown={startResizingSchedule}
          className="hidden w-1 shrink-0 cursor-col-resize border-r bg-transparent hover:bg-primary/40 active:bg-primary/60 md:block"
          title="Drag to resize"
        />

        <main
          className={cn(
            "min-w-0 flex-1 flex-col overflow-y-auto p-3 md:flex",
            mobileTab === "slides" ? "flex" : "hidden"
          )}
        >
          {view === "bible" && passage ? (
            <>
              <p className="pb-2 text-sm font-medium">
                {passage.reference}{" "}
                <span className="font-normal text-muted-foreground">
                  · {passage.translation}
                </span>
              </p>
              <div className="grid gap-2">
                {passage.verses.map((verse, i) => (
                  <div
                    key={i}
                    className="flex w-full flex-col rounded-lg border bg-card p-3 text-left"
                  >
                    <span className="pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Verse {verse.verse}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {verse.text}
                    </span>
                  </div>
                ))}
              </div>
              <p className="pt-4 text-center text-xs text-muted-foreground">
                {isScheduler
                  ? "Add this passage to the service plan to project it."
                  : "Ask a leader to add this passage to the service plan to project it."}
              </p>
            </>
          ) : previewGroup ? (
            <div className="grid gap-2">
              {previewGroup.slides.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {emptyGroupMessage}
                </p>
              ) : (
                previewGroup.slides.map((slide, i) => {
                  const flatIndex = previewGroup.start + i;
                  const isPreviewed = flatIndex === previewIndex;
                  const isLive = hasGoneLive && flatIndex === activeIndex;
                  return (
                    <button
                      key={flatIndex}
                      type="button"
                      onClick={() => goTo(flatIndex)}
                      className={cn(
                        "relative flex w-full flex-col rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/50",
                        isPreviewed && "border-primary ring-2 ring-primary/40"
                      )}
                    >
                      {isLive ? (
                        <span className="absolute right-2 top-2 rounded bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-destructive-foreground">
                          Live
                        </span>
                      ) : null}
                      <span className="pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {slide.isTitleCard ? "Title" : slide.label ?? "Lyrics"}
                      </span>
                      {slide.media ? (
                        // Sized by the media itself: fixed height, width
                        // follows the photo/video's own aspect ratio — no
                        // letterbox bars around the preview. Kept as a direct
                        // flex child: a fit-content wrapper would make the
                        // inner max-width circular and collapse the preview.
                        slide.media.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slide.media.url}
                            alt=""
                            className="h-40 w-auto max-w-full self-start rounded bg-black object-contain"
                          />
                        ) : (
                          <video
                            src={slide.media.url}
                            muted
                            disablePictureInPicture
                            disableRemotePlayback
                            className="h-40 w-auto max-w-full self-start rounded bg-black object-contain"
                          />
                        )
                      ) : slide.richHtml ? (
                        <div
                          className="projected-rich-text line-clamp-4 text-xs leading-relaxed text-muted-foreground"
                          style={{ fontFamily: effectiveFormat.fontFamily }}
                          dangerouslySetInnerHTML={{ __html: slide.richHtml }}
                        />
                      ) : (
                        <span
                          className="grid gap-0.5 text-xs leading-relaxed text-muted-foreground"
                          style={{ fontFamily: effectiveFormat.fontFamily }}
                        >
                          {slide.lines.map((line, j) => (
                            <span key={j} className="truncate">
                              {line || " "}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Music className="size-6" />
              <p>Add songs or Bible verses to the service plan to project them.</p>
            </div>
          )}
          {view === "schedule" ? (
            <p className="pt-4 text-center text-xs text-muted-foreground">
              Use ↑ ↓ or Space to move the preview · Enter to go live · Ctrl+B
              to blank the live output
            </p>
          ) : null}
        </main>

        <div
          onPointerDown={startResizingMonitor}
          className="hidden w-1 shrink-0 cursor-col-resize border-l bg-transparent hover:bg-primary/40 active:bg-primary/60 md:block"
          title="Drag to resize"
        />

        <aside
          className={cn(
            "min-h-0 w-full shrink-0 flex-col overflow-hidden md:flex md:w-[var(--monitor-width)]",
            mobileTab === "monitor" ? "flex" : "hidden"
          )}
          style={{ "--monitor-width": `${monitorWidth}px` } as CSSProperties}
        >
          <div
            className="relative w-full shrink-0 border-b transition-[aspect-ratio] duration-300"
            style={{
              aspectRatio: monitorMediaAspect ?? 16 / 9,
              maxHeight: "50vh",
            }}
          >
            <SlideVisual
              state={livePreview}
              onMediaVideo={handleMonitorMediaVideo}
              onMediaSize={handleMonitorMediaSize}
            />
            <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  connected ? "bg-red-500" : "bg-muted-foreground/60"
                )}
              />
              {connected ? "Live" : "Offline"}
            </span>
          </div>

          {activeSlideMedia?.kind === "video" ? (
            <div className="grid shrink-0 gap-1.5 border-b p-2.5">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    postMediaCommand(
                      mediaStatus?.paused === false ? "pause" : "play"
                    )
                  }
                  title={mediaStatus?.paused === false ? "Pause" : "Play"}
                >
                  {mediaStatus?.paused === false ? <Pause /> : <Play />}
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => postMediaCommand("stop")}
                  title="Stop — back to the start"
                >
                  <Square />
                </Button>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {formatMediaTime(mediaStatus?.currentTime ?? 0)} /{" "}
                  {formatMediaTime(mediaStatus?.duration ?? 0)}
                </span>
                <Volume2 className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(displayVolume * 100)}
                  onChange={(e) => {
                    const volume = Number(e.target.value) / 100;
                    setDesiredVolume(volume);
                    postMediaCommand("volume", volume);
                  }}
                  className="w-16 accent-primary"
                  aria-label="Projector volume"
                  title="Projector volume (the preview here stays silent)"
                />
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(mediaStatus?.duration ?? 0, 0.1)}
                step={0.1}
                value={Math.min(
                  mediaStatus?.currentTime ?? 0,
                  mediaStatus?.duration ?? 0
                )}
                disabled={!mediaStatus?.duration}
                onChange={(e) => postMediaCommand("seek", Number(e.target.value))}
                className="w-full accent-primary disabled:opacity-40"
                aria-label="Seek"
              />
            </div>
          ) : null}

          {isScheduler ? (
            <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto p-3">
              <Tabs defaultValue="theme" className="min-h-0 flex-1">
                <TabsList className="w-full">
                  <TabsTrigger value="theme">Theme</TabsTrigger>
                  <TabsTrigger value="crawl">Crawl</TabsTrigger>
                  <TabsTrigger value="countdown">Countdown</TabsTrigger>
                </TabsList>

                <TabsContent value="theme" className="grid gap-2">
                  <p className="-mt-1 text-[11px] text-muted-foreground">
                    Font, size, color, and emphasis are set per song or verse
                    — see “Format text”. This just controls the background.
                  </p>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">Background</Label>

                    <LocalMediaBin
                      onPick={(url, kind) => {
                        updateSettings({ bgUrl: url, bgType: kind });
                        toast.success("Background set from your folder");
                      }}
                    />

                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={settings.bgType === "none" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => updateSettings({ bgType: "none" })}
                      >
                        Black
                      </Button>
                      <Button
                        variant={settings.bgType !== "none" ? "secondary" : "outline"}
                        size="sm"
                        disabled={!settings.bgUrl}
                        onClick={() =>
                          updateSettings({
                            bgType: /\.(mp4|webm)($|\?)/i.test(settings.bgUrl)
                              ? "video"
                              : "image",
                          })
                        }
                      >
                        <ImageIcon /> Media
                      </Button>
                    </div>
                    <Input
                      value={settings.bgUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        updateSettings({
                          bgUrl: url,
                          bgType: !url
                            ? "none"
                            : /\.(mp4|webm)($|\?)/i.test(url)
                              ? "video"
                              : "image",
                        });
                      }}
                      placeholder="…or paste an image / video URL"
                      className="h-8 text-xs"
                    />
                    {settings.bgUrl.startsWith("blob:") ? (
                      <p className="text-[11px] text-muted-foreground">
                        Chosen from this computer — plays without uploading,
                        until this window closes. It isn&apos;t saved with
                        the theme.
                      </p>
                    ) : null}
                    {settings.bgType === "image" && settings.bgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.bgUrl}
                        alt=""
                        className="aspect-video w-full rounded-md border object-cover"
                      />
                    ) : null}
                    {settings.bgType === "video" && settings.bgUrl ? (
                      <video
                        src={settings.bgUrl}
                        muted
                        loop
                        autoPlay
                        playsInline
                        disablePictureInPicture
                        disableRemotePlayback
                        className="aspect-video w-full rounded-md border object-cover"
                      />
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="crawl" className="grid gap-1.5">
                  <p className="-mt-1 text-[11px] text-muted-foreground">
                    Scrolls an announcement along the bottom of the projector
                    and/or stage display.
                  </p>
                  <Textarea
                    value={crawlText}
                    onChange={(e) => setCrawlText(e.target.value)}
                    placeholder="Announcement to scroll along the bottom…"
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={crawlTarget}
                      onValueChange={(value) =>
                        setCrawlTarget(value as "both" | "projector" | "stage")
                      }
                    >
                      <SelectTrigger className="h-8 flex-1" size="sm">
                        <SelectValue className="text-xs">
                          {crawlTarget === "both"
                            ? "Projector + Stage"
                            : crawlTarget === "projector"
                              ? "Projector only"
                              : "Stage only"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Projector + Stage</SelectItem>
                        <SelectItem value="projector">Projector only</SelectItem>
                        <SelectItem value="stage">Stage only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant={crawlEnabled ? "default" : "outline"}
                      disabled={!crawlText.trim()}
                      onClick={() => setCrawlEnabled((v) => !v)}
                    >
                      {crawlEnabled ? "Showing" : "Show"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="countdown" className="grid gap-1.5">
                  <p className="-mt-1 text-[11px] text-muted-foreground">
                    Shows a ticking countdown in place of the slide text —
                    handy before the service starts. Always visible on the
                    stage display.
                  </p>
                  {countdownEndsAt !== null ? (
                    <div className="flex items-center justify-between rounded-md border bg-muted/40 px-2.5 py-1.5">
                      <span className="font-mono text-base font-bold tabular-nums">
                        <CountdownText endsAt={countdownEndsAt} />
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCountdownEndsAt(null)}
                      >
                        Stop
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={1}
                        max={180}
                        value={countdownMinutes}
                        onChange={(e) =>
                          setCountdownMinutes(
                            Math.max(1, Math.min(180, Number(e.target.value) || 1))
                          )
                        }
                        className="h-8 w-16 text-xs"
                        aria-label="Countdown minutes"
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                      <Button size="sm" className="flex-1" onClick={startCountdown}>
                        <Timer /> Start
                      </Button>
                    </div>
                  )}
                  <Input
                    value={countdownLabel}
                    onChange={(e) => setCountdownLabel(e.target.value)}
                    placeholder="Label (optional) — e.g. “Service starts in”"
                    className="h-8 text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Also show on projector</Label>
                    <Switch
                      checked={countdownOnProjector}
                      onCheckedChange={setCountdownOnProjector}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
