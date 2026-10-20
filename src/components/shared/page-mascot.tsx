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
        "pointer-events-none relative z-10 -mt-4 -mb-4 ml-auto hidden h-28 w-auto shrink-0 self-end drop-shadow-lg sm:block md:-mt-6",
        className
      )}
    />
  );
}
