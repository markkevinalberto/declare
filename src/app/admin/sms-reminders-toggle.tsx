"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setSmsRemindersEnabled } from "./actions";

export function SmsRemindersToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      const result = await setSmsRemindersEnabled(next);
      if (result?.error) {
        setEnabled(!next);
        toast.error(result.error);
      } else {
        toast.success(next ? "SMS reminders enabled" : "SMS reminders disabled");
      }
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <Switch checked={enabled} disabled={pending} onCheckedChange={handleChange} />
      <span className="text-sm">
        {enabled ? "Enabled for every organization" : "Disabled for every organization"}
      </span>
    </div>
  );
}
