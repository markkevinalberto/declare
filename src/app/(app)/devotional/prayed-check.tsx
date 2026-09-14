"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Purely a per-viewer "I did this" checkmark — stored in localStorage
 * keyed by devotional id, not synced anywhere. There's no reason this
 * personal marker needs to be visible to schedulers or other members, so
 * it doesn't need a database column of its own.
 */
export function PrayedCheck({ storageKey }: { storageKey: string }) {
  const [checked, setChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setChecked(localStorage.getItem(storageKey) === "1");
    } catch {
      // Private browsing or blocked storage — just stays unchecked.
    }
    setHydrated(true);
  }, [storageKey]);

  function toggle() {
    const next = !checked;
    setChecked(next);
    try {
      if (next) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch {
      // Nothing to persist — the click still reflects visually this session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
        checked
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400"
          : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        hydrated ? "opacity-100" : "opacity-0"
      )}
    >
      <Heart className={cn("size-4 transition-transform duration-200", checked && "scale-110 fill-current")} />
      {checked ? "You prayed this today" : "Mark as prayed"}
    </button>
  );
}
