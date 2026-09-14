"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setDevotionalsEnabled } from "./actions";

export function DevotionalsEnabledToggle({
  initialEnabled,
  hasDevotionals,
}: {
  initialEnabled: boolean;
  hasDevotionals: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      const result = await setDevotionalsEnabled(next);
      if (result?.error) {
        setEnabled(!next);
        toast.error(result.error);
      } else {
        toast.success(next ? "Weekly devotional turned on" : "Weekly devotional turned off");
      }
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <Switch
        checked={enabled}
        disabled={pending || (!enabled && !hasDevotionals)}
        onCheckedChange={handleChange}
      />
      <span className="text-sm">
        {enabled
          ? "On — sending every Sunday"
          : hasDevotionals
            ? "Off"
            : "Off — add a devotional below first"}
      </span>
    </div>
  );
}
