"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setEmailPreference } from "./actions";

type Item = { key: string; label: string; description: string; enabled: boolean };

export function PreferenceToggles({ items }: { items: Item[] }) {
  const [state, setState] = useState(Object.fromEntries(items.map((i) => [i.key, i.enabled])));
  const [, startTransition] = useTransition();

  function toggle(key: string, next: boolean) {
    setState((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      try {
        await setEmailPreference(key as never, next);
      } catch {
        setState((prev) => ({ ...prev, [key]: !next }));
        toast.error("Could not save. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4">
          <Label htmlFor={`pref-${item.key}`} className="flex flex-col items-start gap-0.5 font-normal">
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.description}</span>
          </Label>
          <Switch
            id={`pref-${item.key}`}
            checked={state[item.key]}
            onCheckedChange={(checked) => toggle(item.key, checked)}
          />
        </div>
      ))}
    </div>
  );
}
