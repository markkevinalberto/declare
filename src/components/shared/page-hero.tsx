import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Page header matching the dashboard: the page's mascot as a large hero sticker
// in the top-right, title + actions vertically centred beside it. The min height
// holds most of the sticker so it only rests on the edge of the content below.
export function PageHero({
  title,
  description,
  mascot,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  mascot: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex min-h-24 flex-col justify-center pb-2 pr-24 sm:min-h-40 sm:pr-52", className)}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
      {actions ? <div className="relative z-20 mt-3 flex flex-wrap items-center gap-2">{actions}</div> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mascot}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-3 z-10 h-28 w-auto drop-shadow-lg sm:-right-4 sm:-top-4 sm:h-52 md:-top-6 print:hidden"
      />
    </div>
  );
}
