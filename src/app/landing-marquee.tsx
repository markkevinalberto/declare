import {
  BellRing,
  CalendarCheck,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
  Workflow,
} from "lucide-react";
import { FEATURES as FEATURE_FLAGS } from "@/lib/features";

type Keyword = { icon: typeof BellRing; label: string; tone: string; requires?: "planning" | "presenter" };

const ALL_KEYWORDS: Keyword[] = [
  { icon: UsersRound, label: "Volunteer scheduling", tone: "bg-(--sky)" },
  { icon: Workflow, label: "Service planning", tone: "bg-(--lilac)", requires: "planning" },
  { icon: ShieldCheck, label: "Conflict detection", tone: "bg-(--mint)" },
  { icon: MessageSquareText, label: "Team messaging", tone: "bg-(--blush)" },
  { icon: BellRing, label: "SMS & email reminders", tone: "bg-(--butter)" },
  { icon: CalendarCheck, label: "Blockout dates", tone: "bg-(--peach)" },
];

export function LandingMarquee() {
  const keywords = ALL_KEYWORDS.filter((k) => !k.requires || FEATURE_FLAGS[k.requires]);
  // Duplicated once so translateX(-50%) loops with no visible seam.
  const track = [...keywords, ...keywords];

  return (
    // A slightly tilted pastel ribbon of feature pills; pauses on hover
    <div className="overflow-hidden py-8">
      <div className="-mx-4 -rotate-[1.5deg] bg-gradient-to-r from-(--lilac) via-(--sky) to-(--mint) py-4 shadow-[0_10px_30px_-12px_rgb(36_91_255/0.25)]">
        <div className="flex w-max animate-marquee gap-3">
          {track.map((item, i) => {
            const Icon = item.icon;
            return (
              <span
                key={`${item.label}-${i}`}
                className="flex shrink-0 items-center gap-2 rounded-full bg-white/85 py-1.5 pr-4 pl-1.5 text-sm font-semibold text-(--ink) shadow-sm ring-1 ring-white"
              >
                <span className={`flex size-7 items-center justify-center rounded-full ${item.tone}`}>
                  <Icon className="size-3.5 text-(--ink)" />
                </span>
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
