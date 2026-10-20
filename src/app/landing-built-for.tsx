"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Fills the "social proof carousel" slot honestly — Declare doesn't have
// public customer quotes to show yet, so this rotates through what each
// role on a church team actually gets out of it instead of inventing
// testimonials.
const PANELS = [
  {
    role: "Schedulers & admins",
    sticker: "/mascot/full/girl_idea.png",
    tone: "var(--butter)",
    headline: "Stop chasing people down in the group chat",
    body: "Assign a role and Declare checks blockout dates and conflicts, then sends the invite. See who's confirmed and who still needs a nudge, at a glance.",
  },
  {
    role: "Volunteers",
    sticker: "/mascot/full/boy_running.png",
    tone: "var(--mint)",
    headline: "One tap to accept, decline, or see what's next",
    body: "Get invited by email or text and respond from your phone. Everything you're serving shows up in one upcoming-schedule view, no spreadsheet link to dig up.",
  },
  {
    role: "Team & worship leads",
    sticker: "/mascot/full/duo_headset.png",
    tone: "var(--lilac)",
    headline: "Walk into Sunday already knowing who's in the room",
    body: "See every role filled or flagged days in advance, not the morning of, and message a whole team at once when plans change.",
  },
] as const;

export function LandingBuiltFor() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Rotates on its own, but holds still while someone is reading or hovering
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % PANELS.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="grid gap-5 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-6"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {PANELS.map((panel, i) => (
          <button
            key={panel.role}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={cn(
              "group flex shrink-0 items-center gap-3 rounded-2xl py-2 pr-4 pl-2 text-left text-sm font-semibold text-(--ink) ring-1 transition-[background-color,box-shadow,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-primary",
              i === active ? "shadow-md ring-white" : "bg-white ring-(--border) hover:-translate-y-0.5 hover:shadow-sm"
            )}
            style={i === active ? { background: panel.tone } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={panel.sticker}
              alt=""
              aria-hidden="true"
              className="size-11 object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
            />
            {panel.role}
          </button>
        ))}
      </div>

      <div className="relative min-h-80 sm:min-h-72">
        {PANELS.map((panel, i) => (
          <div
            key={panel.role}
            className={cn(
              "absolute inset-0 overflow-hidden rounded-[2rem] p-7 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-10",
              i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
            )}
            style={{ background: panel.tone }}
          >
            <div aria-hidden="true" className="absolute -right-16 -bottom-16 size-72 rounded-full bg-white/45 blur-2xl" />
            <div className="relative max-w-md pr-28 sm:pr-0">
              <p className="text-xs font-semibold tracking-wider text-(--ink)/60 uppercase">{panel.role}</p>
              <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {panel.headline}
              </h3>
              <p className="mt-3 text-(--ink)/75 text-balance">{panel.body}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={panel.sticker}
              alt=""
              aria-hidden="true"
              className={cn(
                "sticker absolute right-4 bottom-4 h-32 w-auto drop-shadow-xl transition-[scale,rotate] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] sm:right-10 sm:bottom-6 sm:h-48",
                i === active ? "scale-100 rotate-0" : "scale-75 rotate-6"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
