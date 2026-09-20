import type { LucideIcon } from "lucide-react";

export function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-sm shadow-primary/25">
      <Icon className="size-4.5 text-primary-foreground" />
    </span>
  );
}
