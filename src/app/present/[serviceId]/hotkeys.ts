"use client";

import { useSyncExternalStore } from "react";

/** A single key combination — modifiers plus one base key. */
export type KeyCombo = {
  /** `event.key`, always lowercased (e.g. "b", "f9", "1", " "). */
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
};

export type GlobalActionId =
  | "blank"
  | "clearText"
  | "openProjector"
  | "openStage"
  | "goLive";

export const GLOBAL_ACTION_LABELS: Record<GlobalActionId, string> = {
  blank: "Blank the screen",
  clearText: "Clear text (keep background)",
  openProjector: "Open projector",
  openStage: "Open stage display",
  goLive: "Push preview to live",
};

/**
 * A "press this key, jump to this song section" binding. Song section
 * labels are freeform text typed into `[Verse 1]`-style markers when
 * writing lyrics, so matching is against normalized text, not a fixed enum
 * — this list is fully user-editable for exactly that reason.
 */
export type SectionBinding = {
  id: string;
  /** Text to match against the active song's slide labels (normalized). */
  matchText: string;
  combo: KeyCombo;
};

export const DEFAULT_GLOBAL_KEYMAP: Record<GlobalActionId, KeyCombo> = {
  blank: { key: "b", ctrl: true, alt: false, shift: false },
  clearText: { key: "c", ctrl: true, alt: false, shift: false },
  openProjector: { key: "f9", ctrl: false, alt: false, shift: false },
  openStage: { key: "f10", ctrl: false, alt: false, shift: false },
  goLive: { key: "enter", ctrl: false, alt: false, shift: false },
};

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `section-${idCounter}`;
}

export function defaultSectionBindings(): SectionBinding[] {
  return [
    { id: nextId(), matchText: "Verse 1", combo: { key: "1", ctrl: false, alt: false, shift: false } },
    { id: nextId(), matchText: "Verse 2", combo: { key: "2", ctrl: false, alt: false, shift: false } },
    { id: nextId(), matchText: "Verse 3", combo: { key: "3", ctrl: false, alt: false, shift: false } },
    { id: nextId(), matchText: "Pre-Chorus", combo: { key: "p", ctrl: false, alt: false, shift: false } },
    { id: nextId(), matchText: "Chorus", combo: { key: "c", ctrl: false, alt: false, shift: false } },
    { id: nextId(), matchText: "Bridge", combo: { key: "b", ctrl: false, alt: false, shift: false } },
  ];
}

export type HotkeySettings = {
  global: Record<GlobalActionId, KeyCombo>;
  sections: SectionBinding[];
};

// A single stable instance for read-snapshot purposes (the SSR/no-data
// fallback) — useSyncExternalStore requires getServerSnapshot to return the
// SAME reference across calls, or React sees "a new value every render" and
// warns of a possible infinite loop. Callers that need a fresh, independently
// mutable copy to write (e.g. "Reset to defaults") should use
// `defaultSectionBindings()` directly instead, which mints new ids each call.
const DEFAULT_SETTINGS: HotkeySettings = {
  global: DEFAULT_GLOBAL_KEYMAP,
  sections: defaultSectionBindings(),
};

/** Strips everything but letters/digits and lowercases — "Pre-Chorus" and
 * "pre chorus" and "PRECHORUS" all normalize to the same "prechorus". */
export function normalizeMatchText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function displayKeyName(key: string): string {
  if (key === " ") return "Space";
  if (/^f\d{1,2}$/.test(key)) return key.toUpperCase();
  if (key.length === 1) return key.toUpperCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatCombo(combo: KeyCombo): string {
  const parts: string[] = [];
  if (combo.ctrl) parts.push("Ctrl");
  if (combo.alt) parts.push("Alt");
  if (combo.shift) parts.push("Shift");
  parts.push(displayKeyName(combo.key));
  return parts.join("+");
}

export function comboEquals(a: KeyCombo, b: KeyCombo): boolean {
  return (
    a.key === b.key && a.ctrl === b.ctrl && a.alt === b.alt && a.shift === b.shift
  );
}

export function eventMatchesCombo(e: KeyboardEvent, combo: KeyCombo): boolean {
  return (
    e.key.toLowerCase() === combo.key &&
    e.ctrlKey === combo.ctrl &&
    e.altKey === combo.alt &&
    e.shiftKey === combo.shift
  );
}

/** Builds a combo from a captured keydown — null for a bare modifier press
 * (Ctrl/Alt/Shift/Meta alone aren't valid combos on their own). */
export function comboFromEvent(e: KeyboardEvent): KeyCombo | null {
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return null;
  return {
    key: e.key.toLowerCase(),
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
  };
}

const STORAGE_KEY = "presenter-hotkeys";

// Same caching approach as display-preferences.tsx's useSyncExternalStore:
// getSnapshot must return a STABLE reference between calls when nothing
// changed, or React sees "a new value every render" and warns of a
// possible infinite loop.
let cachedRaw: string | null | undefined;
let cachedSettings: HotkeySettings = DEFAULT_SETTINGS;

function readSettings(): HotkeySettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSettings;
  cachedRaw = raw;
  if (!raw) {
    cachedSettings = DEFAULT_SETTINGS;
    return cachedSettings;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedSettings = {
      global: { ...DEFAULT_GLOBAL_KEYMAP, ...parsed.global },
      sections: Array.isArray(parsed.sections) ? parsed.sections : DEFAULT_SETTINGS.sections,
    };
  } catch {
    cachedSettings = DEFAULT_SETTINGS;
  }
  return cachedSettings;
}

export function writeSettings(settings: HotkeySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("presenter-hotkeys-change"));
}

function subscribeSettings(callback: () => void) {
  window.addEventListener("presenter-hotkeys-change", callback);
  return () => window.removeEventListener("presenter-hotkeys-change", callback);
}
function getSettingsServerSnapshot(): HotkeySettings {
  return DEFAULT_SETTINGS;
}

/** Reads the persisted hotkey settings — hydration-safe (SSR has no localStorage). */
export function useHotkeySettings() {
  return useSyncExternalStore(
    subscribeSettings,
    readSettings,
    getSettingsServerSnapshot
  );
}
