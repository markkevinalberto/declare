"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SONG_PARTS = [
  "Intro",
  "Verse 1",
  "Verse 2",
  "Verse 3",
  "Pre-Chorus",
  "Chorus",
  "Bridge",
  "Interlude",
  "Tag",
  "Outro",
  "Ending",
];

export function SongPartsLyricsField({
  id,
  name = "lyrics",
  defaultValue = "",
  hideLabel = false,
}: {
  id: string;
  name?: string;
  defaultValue?: string;
  hideLabel?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertPart(label: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);

    let prefix = "";
    if (before.length > 0) {
      prefix = before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    }
    const inserted = `${prefix}[${label}]\n`;
    const next = before + inserted + after;
    setValue(next);

    requestAnimationFrame(() => {
      const pos = (before + inserted).length;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="grid gap-2">
      {hideLabel ? null : <Label htmlFor={id}>Lyrics</Label>}
      <div className="flex flex-wrap gap-1.5">
        {SONG_PARTS.map((part) => (
          <button
            key={part}
            type="button"
            onClick={() => insertPart(part)}
            className={cn(
              "rounded-full border border-input bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground hover:border-accent"
            )}
          >
            + {part}
          </button>
        ))}
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder="Tap a song part above, or type your own…"
      />
    </div>
  );
}
