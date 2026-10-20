import { cn } from "@/lib/utils";

// In-flow header sticker: it can't cover the row's buttons, and hangs into the gap below.
export function PageMascot({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={cn(
        // Smaller on phones (incl. the Android app), full size from sm up
        "pointer-events-none relative z-10 -mt-2 -mb-3 ml-auto block h-16 w-auto shrink-0 self-end drop-shadow-lg sm:-mt-4 sm:-mb-4 sm:h-28 md:-mt-6",
        className
      )}
    />
  );
}
