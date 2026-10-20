import { cn } from "@/lib/utils";

// Stands on the top edge of the card rendered right after it, overlapping only the card's top padding.
export function CardSticker({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative z-10 mx-auto -mb-3 block h-32 w-auto drop-shadow-lg",
        className
      )}
    />
  );
}
