import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const LABELS = {
  draft: "Draft — not yet invited",
  invited: "Invited — no response yet",
  accepted: "Accepted",
  declined: "Declined",
};

const COLORS = {
  draft: "bg-muted-foreground/40",
  invited: "bg-zinc-400",
  accepted: "bg-green-500",
  declined: "bg-red-500",
};

export function PositionStatusIcon({
  status,
}: {
  status: "draft" | "invited" | "accepted" | "declined";
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("inline-block size-2.5 rounded-full", COLORS[status])} />} />
      <TooltipContent>{LABELS[status]}</TooltipContent>
    </Tooltip>
  );
}
