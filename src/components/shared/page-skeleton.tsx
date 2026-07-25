import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({
  rows = 5,
  showHeaderAction = false,
}: {
  rows?: number;
  showHeaderAction?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        {showHeaderAction ? <Skeleton className="h-9 w-28" /> : null}
      </div>
      <div className="grid gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
