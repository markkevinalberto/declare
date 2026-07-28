"use client";

import { useState, useSyncExternalStore } from "react";
import { MonitorCog, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getDesktopBridge, isElectron } from "./electron-bridge";

// The Window Management API isn't in TypeScript's default DOM lib yet, and
// is Chromium-only (Chrome/Edge) behind a secure context (https:// or
// localhost) — a LAN IP over plain http:// will never have it. Minimal
// local types for just what this file uses.
type ScreenDetailed = {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary: boolean;
};
type ScreenDetails = { screens: ScreenDetailed[] };

function getScreenDetailsFn() {
  return (
    window as unknown as {
      getScreenDetails?: () => Promise<ScreenDetails>;
    }
  ).getScreenDetails;
}

/** A saved screen choice — the live screen list is re-detected fresh each
 * time (screens can be reconfigured), then matched against this by label. */
export type ScreenChoice = {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

const STORAGE_KEY = "presenter-display-prefs";

type StoredPrefs = { projector: ScreenChoice; stage: ScreenChoice };

// useSyncExternalStore requires getSnapshot to return a STABLE reference
// between calls when nothing actually changed — parsing localStorage fresh
// on every call would return a new object each time even when its content
// is identical, which React reads as "the store changed on every render"
// and warns of a possible infinite loop. Cache the parsed result and only
// recompute when the underlying raw string actually differs.
const EMPTY_PREFS: StoredPrefs = { projector: null, stage: null };
let cachedRaw: string | null | undefined;
let cachedPrefs: StoredPrefs = EMPTY_PREFS;

function readStoredPrefs(): StoredPrefs {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedPrefs;
  cachedRaw = raw;
  if (!raw) {
    cachedPrefs = EMPTY_PREFS;
    return cachedPrefs;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedPrefs = {
      projector: parsed.projector ?? null,
      stage: parsed.stage ?? null,
    };
  } catch {
    cachedPrefs = EMPTY_PREFS;
  }
  return cachedPrefs;
}

function writeStoredPrefs(prefs: StoredPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("presenter-display-prefs-change"));
}

function subscribePrefs(callback: () => void) {
  window.addEventListener("presenter-display-prefs-change", callback);
  return () =>
    window.removeEventListener("presenter-display-prefs-change", callback);
}
function getPrefsServerSnapshot(): StoredPrefs {
  return EMPTY_PREFS;
}

/** Reads the persisted screen choices — hydration-safe (SSR has no localStorage). */
export function useDisplayPreferences() {
  return useSyncExternalStore(
    subscribePrefs,
    readStoredPrefs,
    getPrefsServerSnapshot
  );
}

/**
 * Opens `url` in a window sized and positioned to fill `choice`'s screen
 * (re-detecting live screens and matching by label — screens can be
 * reconfigured since the choice was saved — falling back to the saved
 * bounds directly if no live match is found). Falls back to a plain
 * same-window-target open when there's no choice or detection fails, which
 * callers should otherwise handle via a plain anchor for mobile safety.
 *
 * Inside the Electron desktop shell, this delegates to the native bridge
 * instead — real OS window placement, no Window Management API involved.
 */
export async function openOnPreferredScreen(
  kind: "projector" | "stage",
  url: string,
  windowName: string,
  choice: ScreenChoice
) {
  // Callers pass root-relative paths (e.g. `/present/${service.id}/screen`),
  // which browser window.open() resolves fine against the current origin,
  // but Electron's BrowserWindow.loadURL() has no such implicit base and
  // fails with ERR_INVALID_URL. Resolve to an absolute URL up front so both
  // paths get a URL they can actually load.
  const absoluteUrl = new URL(url, window.location.origin).toString();
  const bridge = getDesktopBridge();
  if (bridge) {
    await bridge.openPresenterWindow(kind, absoluteUrl, choice);
    return;
  }
  if (!choice) {
    window.open(absoluteUrl, windowName);
    return;
  }
  const getScreenDetails = getScreenDetailsFn();
  let bounds: ScreenChoice = choice;
  if (getScreenDetails) {
    try {
      const details = await getScreenDetails();
      const match = details.screens.find((s) => s.label === choice.label);
      if (match) {
        bounds = {
          label: match.label,
          left: match.left,
          top: match.top,
          width: match.width,
          height: match.height,
        };
      }
    } catch {
      // Permission revoked or unavailable now — fall back to the saved bounds.
    }
  }
  window.open(
    absoluteUrl,
    windowName,
    `left=${bounds.left},top=${bounds.top},width=${bounds.width},height=${bounds.height}`
  );
}

function screenLabel(s: ScreenDetailed) {
  return `${s.label || "Display"} — ${s.width}×${s.height}${s.isPrimary ? " (primary)" : ""}`;
}

function ScreenPicker({
  label,
  screens,
  value,
  onChange,
}: {
  label: string;
  screens: ScreenDetailed[];
  value: ScreenChoice;
  onChange: (choice: ScreenChoice) => void;
}) {
  const selectedKey = value ? `${value.label}:${value.left}:${value.top}` : "default";
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={selectedKey}
        onValueChange={(key) => {
          if (key === "default") {
            onChange(null);
            return;
          }
          const screen = screens.find(
            (s) => `${s.label}:${s.left}:${s.top}` === key
          );
          if (screen) {
            onChange({
              label: screen.label,
              left: screen.left,
              top: screen.top,
              width: screen.width,
              height: screen.height,
            });
          }
        }}
      >
        <SelectTrigger className="w-full" size="sm">
          <SelectValue className="truncate text-xs">
            {value
              ? `${value.label || "Display"} (${value.width}×${value.height})`
              : "This window (default)"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">This window (default)</SelectItem>
          {screens.map((s) => (
            <SelectItem key={`${s.label}:${s.left}:${s.top}`} value={`${s.label}:${s.left}:${s.top}`}>
              {screenLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Settings popover for assigning the projector and stage display to
 * specific physical screens. Only works on Chrome/Edge over a secure
 * context (https:// or localhost) — the Window Management API that makes
 * this possible doesn't exist anywhere else, including every mobile
 * browser, so this degrades to an explanatory note rather than a picker.
 */
export function DisplayPreferencesPopover() {
  const prefs = useDisplayPreferences();
  const [screens, setScreens] = useState<ScreenDetailed[] | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const supported = useSyncExternalStore(
    () => () => {},
    () => isElectron() || (Boolean(getScreenDetailsFn()) && window.isSecureContext),
    () => false
  );

  async function detectScreens() {
    const bridge = getDesktopBridge();
    if (bridge) {
      setDetecting(true);
      setDetectError(null);
      try {
        setScreens(await bridge.getDisplays());
      } catch {
        setDetectError("Could not read your displays.");
      } finally {
        setDetecting(false);
      }
      return;
    }
    const getScreenDetails = getScreenDetailsFn();
    if (!getScreenDetails) return;
    setDetecting(true);
    setDetectError(null);
    try {
      const details = await getScreenDetails();
      setScreens(details.screens);
    } catch {
      setDetectError(
        "Permission to see your displays was denied. Your browser may ask again next time."
      );
    } finally {
      setDetecting(false);
    }
  }

  function updatePrefs(patch: Partial<StoredPrefs>) {
    writeStoredPrefs({ ...prefs, ...patch });
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <MonitorCog /> Displays
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverTitle>Display assignment</PopoverTitle>
        <p className="-mt-1 text-[11px] text-muted-foreground">
          {isElectron() ? (
            "Pick which physical screen the projector and stage display open on."
          ) : (
            <>
              Pick which physical screen the projector and stage display open
              on. Needs Chrome or Edge, and only works when this page is
              opened as <code>localhost</code> or over <code>https://</code> —
              a plain network address like <code>http://192.168.x.x</code>{" "}
              can&apos;t use it, so both will just open as a normal tab
              instead.
            </>
          )}
        </p>

        {!supported ? (
          <p className="rounded-md border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
            Not available in this browser/connection — projector and stage
            display will open as regular tabs. Drag them to your other
            screen and use the fullscreen prompt there.
          </p>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={detecting}
              onClick={detectScreens}
            >
              <RefreshCw className={detecting ? "animate-spin" : ""} />
              {screens ? "Refresh displays" : "Detect displays"}
            </Button>
            {detectError ? (
              <p className="text-[11px] text-destructive">{detectError}</p>
            ) : null}
            {screens ? (
              <>
                <ScreenPicker
                  label="Projector"
                  screens={screens}
                  value={prefs.projector}
                  onChange={(choice) => updatePrefs({ projector: choice })}
                />
                <ScreenPicker
                  label="Stage display"
                  screens={screens}
                  value={prefs.stage}
                  onChange={(choice) => updatePrefs({ stage: choice })}
                />
              </>
            ) : null}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
