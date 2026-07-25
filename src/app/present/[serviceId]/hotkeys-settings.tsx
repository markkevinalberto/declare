"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DEFAULT_GLOBAL_KEYMAP,
  GLOBAL_ACTION_LABELS,
  comboEquals,
  comboFromEvent,
  defaultSectionBindings,
  formatCombo,
  useHotkeySettings,
  writeSettings,
  type GlobalActionId,
  type HotkeySettings,
  type KeyCombo,
  type SectionBinding,
} from "./hotkeys";

const GLOBAL_ACTION_IDS = Object.keys(GLOBAL_ACTION_LABELS) as GlobalActionId[];

/** Captures the next real keydown while active and reports it; Escape cancels. */
function useKeyRecorder(
  active: boolean,
  onCapture: (combo: KeyCombo | null) => void
) {
  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        onCapture(null);
        return;
      }
      const combo = comboFromEvent(e);
      if (combo) onCapture(combo);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, onCapture]);
}

function findConflict(
  settings: HotkeySettings,
  combo: KeyCombo,
  excludeId: string
): string | null {
  for (const id of GLOBAL_ACTION_IDS) {
    if (id !== excludeId && comboEquals(settings.global[id], combo)) {
      return GLOBAL_ACTION_LABELS[id];
    }
  }
  for (const section of settings.sections) {
    if (section.id !== excludeId && comboEquals(section.combo, combo)) {
      return section.matchText;
    }
  }
  return null;
}

function ComboButton({
  combo,
  rowId,
  recordingId,
  conflict,
  onStartRecording,
}: {
  combo: KeyCombo;
  rowId: string;
  recordingId: string | null;
  conflict: string | null;
  onStartRecording: (id: string) => void;
}) {
  const recording = recordingId === rowId;
  return (
    <Button
      type="button"
      variant={recording ? "default" : "outline"}
      size="sm"
      className={cn("h-7 min-w-20 font-mono", conflict && !recording && "border-destructive text-destructive")}
      onClick={() => onStartRecording(rowId)}
      title={conflict ? `Also used by "${conflict}"` : "Click, then press a key"}
    >
      {recording ? "Press a key…" : formatCombo(combo)}
    </Button>
  );
}

/**
 * Settings popover for the presenter's keyboard shortcuts. Global actions
 * (Blank, Clear, open the projector/stage) each get one rebindable key; the
 * "jump to song section" list is fully user-editable rows, since section
 * labels (Verse 1, Chorus, Bridge, …) are freeform text typed into
 * `[Section]` markers when writing lyrics, not a fixed set the app defines.
 */
export function HotkeySettingsPopover() {
  const settings = useHotkeySettings();
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const handleCapture = (combo: KeyCombo | null) => {
    const id = recordingId;
    setRecordingId(null);
    if (!combo || !id) return;
    if ((GLOBAL_ACTION_IDS as string[]).includes(id)) {
      writeSettings({
        ...settings,
        global: { ...settings.global, [id]: combo },
      });
    } else {
      writeSettings({
        ...settings,
        sections: settings.sections.map((s) =>
          s.id === id ? { ...s, combo } : s
        ),
      });
    }
  };
  // handleCapture reads `recordingId`/`settings` via closure, so the recorder
  // effect must re-subscribe whenever either changes — captured via the ref
  // below instead of listing them as deps, since a fresh function identity
  // every render would otherwise tear the listener down and back up on every
  // keystroke elsewhere on the page.
  const handleCaptureRef = useRef(handleCapture);
  useEffect(() => {
    handleCaptureRef.current = handleCapture;
  });
  useKeyRecorder(recordingId !== null, (combo) => handleCaptureRef.current(combo));

  function updateSection(id: string, patch: Partial<SectionBinding>) {
    writeSettings({
      ...settings,
      sections: settings.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function removeSection(id: string) {
    writeSettings({
      ...settings,
      sections: settings.sections.filter((s) => s.id !== id),
    });
  }

  function addSection() {
    writeSettings({
      ...settings,
      sections: [
        ...settings.sections,
        {
          id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          matchText: "",
          combo: { key: "", ctrl: false, alt: false, shift: false },
        },
      ],
    });
  }

  function resetToDefaults() {
    writeSettings({
      global: DEFAULT_GLOBAL_KEYMAP,
      sections: defaultSectionBindings(),
    });
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) setRecordingId(null);
      }}
    >
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <Keyboard /> Shortcuts
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <div className="flex items-center justify-between">
          <PopoverTitle>Keyboard shortcuts</PopoverTitle>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={resetToDefaults}>
            <RotateCcw /> Reset
          </Button>
        </div>
        <p className="-mt-1 text-[11px] text-muted-foreground">
          Click a key, then press the new key on your keyboard. Doesn&apos;t
          apply while typing in a text field. Esc cancels.
        </p>

        <div className="grid gap-1.5">
          <Label className="text-xs">Global</Label>
          {GLOBAL_ACTION_IDS.map((id) => {
            const combo = settings.global[id];
            const conflict = findConflict(settings, combo, id);
            return (
              <div key={id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {GLOBAL_ACTION_LABELS[id]}
                </span>
                <ComboButton
                  combo={combo}
                  rowId={id}
                  recordingId={recordingId}
                  conflict={conflict}
                  onStartRecording={setRecordingId}
                />
              </div>
            );
          })}
        </div>

        <div className="grid gap-1.5 border-t pt-2">
          <Label className="text-xs">Jump to song section</Label>
          <p className="-mt-1 text-[11px] text-muted-foreground">
            Jumps to the first slide in the current song/verse whose label
            matches — e.g. a slide marked “Verse 1” in the lyrics.
          </p>
          {settings.sections.map((section) => {
            const conflict = section.combo.key
              ? findConflict(settings, section.combo, section.id)
              : null;
            return (
              <div key={section.id} className="flex items-center gap-1.5">
                <Input
                  value={section.matchText}
                  onChange={(e) =>
                    updateSection(section.id, { matchText: e.target.value })
                  }
                  placeholder="e.g. Verse 4"
                  className="h-7 flex-1 text-xs"
                />
                <ComboButton
                  combo={section.combo}
                  rowId={section.id}
                  recordingId={recordingId}
                  conflict={conflict}
                  onStartRecording={setRecordingId}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove shortcut"
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus /> Add shortcut
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
