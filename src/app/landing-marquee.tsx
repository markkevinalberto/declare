import {
  BellRing,
  CalendarCheck,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
  Workflow,
} from "lucide-react";
import { FEATURES as FEATURE_FLAGS } from "@/lib/features";

type Keyword = { icon: typeof BellRing; label: string; requires?: "planning" | "presenter" };

const ALL_KEYWORDS: Keyword[] = [
  { icon: UsersRound, label: "Volunteer scheduling" },
  { icon: Workflow, label: "Service planning", requires: "planning" },
  { icon: ShieldCheck, label: "Conflict detection" },
  { icon: MessageSquareText, label: "Team messaging" },
  { icon: BellRing, label: "SMS & email reminders" },
  { icon: CalendarCheck, label: "Blockout dates" },
];

export function LandingMarquee() {
  const keywords = ALL_KEYWORDS.filter((k) => !k.requires || FEATURE_FLAGS[k.requires]);
  // Duplicated once so translateX(-50%) loops with no visible seam.
  const track = [...keywords, ...keywords];

  return (
    <div className="overflow-hidden border-y bg-card/60 py-5">
      <div className="flex w-max animate-marquee gap-10">
        {track.map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={`${item.label}-${i}`}
              className="flex shrink-0 items-center gap-2.5 text-sm font-medium text-muted-foreground"
            >
              <Icon className="size-4 text-primary" />
              {item.label}
              <span className="ml-8 text-border" aria-hidden="true">
                &bull;
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
