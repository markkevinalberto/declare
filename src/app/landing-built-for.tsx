"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ClipboardCheck, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

// Fills the "social proof carousel" slot honestly — Declare doesn't have
// public customer quotes to show yet, so this rotates through what each
// role on a church team actually gets out of it instead of inventing
// testimonials.
const PANELS = [
  {
    icon: ClipboardCheck,
    role: "Schedulers & admins",
    headline: "Stop chasing people down in the group chat",
    body: "Assign a role, Declare checks blockout dates and conflicts automatically, and sends the invite. You see who's confirmed and who still needs a nudge, at a glance.",
  },
  {
    icon: HeartHandshake,
    role: "Volunteers",
    headline: "One tap to accept, decline, or see what's next",
    body: "Get invited by email or text, respond from your phone, and see everything you're serving in one upcoming-schedule view — no spreadsheet link to dig up.",
  },
  {
    icon: CalendarClock,
    role: "Team & worship leads",
    headline: "Walk into Sunday already knowing who's in the room",
    body: "See every role for the service filled or flagged days in advance, not the morning of — and message a whole team at once when plans change.",
  },
] as const;

export function LandingBuiltFor() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % PANELS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-14">
      <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1.5">
        {PANELS.map((panel, i) => (
          <button
            key={panel.role}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
              i === active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {panel.role}
          </button>
        ))}
      </div>

      <div className="relative min-h-52">
        {PANELS.map((panel, i) => {
          const Icon = panel.icon;
          return (
            <div
              key={panel.role}
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-out",
                i === active
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
                <Icon className="size-6 text-primary-foreground" />
              </span>
              <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {panel.headline}
              </h3>
              <p className="mt-3 max-w-lg text-muted-foreground text-balance">{panel.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
