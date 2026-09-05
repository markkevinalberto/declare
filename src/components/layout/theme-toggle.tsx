"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined until next-themes reads the stored/system
  // preference on the client — rendering a guess here would flash the
  // wrong icon and mismatch what SSR sent down.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // The standard next-themes hydration guard: this only needs to run once,
    // purely to detect "we're on the client now" — there's no external value
    // to synchronize, so the usual effect-vs-setState guidance doesn't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1.5" title="Toggle dark mode">
      <Sun className="size-4 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={isDark}
        disabled={!mounted}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon className="size-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}
