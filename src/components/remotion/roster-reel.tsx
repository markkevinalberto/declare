import { Check } from "lucide-react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cn } from "@/lib/utils";

export type ReelStatus = "accepted" | "invited" | "declined" | "draft";
export type ReelRole = { name: string; mascot: string; person: string | null; status: ReelStatus };
export type RosterReelProps = {
  eyebrow: string;
  title: string;
  when: string;
  roles: ReelRole[];
  /** demo: every role flips Invited → Confirmed; live: roles show their real status */
  mode: "demo" | "live";
  /** Live mode: counts across the whole lineup, not just the cards shown */
  totals?: { confirmed: number; total: number };
};

export const REEL_FPS = 30;

// Layout is drawn 1:1 with CSS pixels (the player sizes the composition to its container)
const PAD = 24;
const HEADER = 52;
const FOOTER = 36;
const GAP = 10;
const CARD_H = 76;
const SECTION_GAP = 16;

const ENTER_AT = 10;
const STAGGER = 6;
const FLIP_AT = 72;
const FLIP_STAGGER = 14;

export function reelColumns(width: number) {
  return width >= 900 ? 3 : width >= 520 ? 2 : 1;
}

export function reelHeight(width: number, count: number) {
  const rows = Math.max(1, Math.ceil(count / reelColumns(width)));
  return PAD * 2 + HEADER + SECTION_GAP * 2 + rows * CARD_H + (rows - 1) * GAP + FOOTER;
}

export function reelDuration(mode: RosterReelProps["mode"], count: number) {
  return mode === "demo"
    ? FLIP_AT + count * FLIP_STAGGER + 90
    : ENTER_AT + count * STAGGER + 60;
}

const CHIP: Record<ReelStatus, { label: string; className: string }> = {
  accepted: { label: "Confirmed", className: "bg-green-500/15 text-green-700 dark:text-green-400" },
  invited: { label: "Invited", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  declined: { label: "Declined", className: "bg-red-500/15 text-red-700 dark:text-red-400" },
  draft: { label: "Not invited", className: "bg-muted text-muted-foreground" },
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function RoleCard({ role, index, mode }: { role: ReelRole; index: number; mode: RosterReelProps["mode"] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - (ENTER_AT + index * STAGGER), fps, config: { damping: 200 } });
  const pop = spring({ frame: frame - (ENTER_AT + 5 + index * STAGGER), fps, config: { damping: 9, stiffness: 160 } });

  const flipFrame = FLIP_AT + index * FLIP_STAGGER;
  const flipped = mode === "demo" && frame >= flipFrame;
  const status: ReelStatus = mode === "demo" ? (flipped ? "accepted" : "invited") : role.status;
  const chipPop = flipped ? spring({ frame: frame - flipFrame, fps, config: { damping: 12, stiffness: 180 } }) : 1;
  const glow = mode === "demo" ? interpolate(frame - flipFrame, [0, 6, 30], [0, 1, 0], clamp) : 0;

  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-xl border bg-background/70 px-3"
      style={{
        height: CARD_H,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
        boxShadow: glow > 0 ? `0 0 0 2px rgba(34, 197, 94, ${glow * 0.9})` : undefined,
      }}
    >
      <Img
        src={role.mascot}
        style={{
          width: 58,
          height: 58,
          objectFit: "contain",
          flexShrink: 0,
          transform: `scale(${pop}) rotate(${interpolate(pop, [0, 1], [-14, 0])}deg)`,
        }}
      />
      {/* Chip sits under the name (beside the person) so the role name keeps the full width */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-[15px] leading-tight font-semibold tracking-tight">{role.name}</p>
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex shrink-0 origin-left items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              CHIP[status].className
            )}
            style={{ transform: `scale(${interpolate(chipPop, [0, 1], [0.6, 1])})` }}
          >
            {status === "accepted" ? <Check className="size-3" /> : null}
            {CHIP[status].label}
          </span>
          <span className="truncate text-xs text-muted-foreground">{role.person ?? "Open spot"}</span>
        </div>
      </div>
    </div>
  );
}

export function RosterReel({ eyebrow, title, when, roles, mode, totals }: RosterReelProps) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const head = spring({ frame, fps, config: { damping: 200 } });
  const total = totals?.total ?? roles.length;

  const lastFlip = FLIP_AT + (roles.length - 1) * FLIP_STAGGER;
  const target = totals?.confirmed ?? roles.filter((r) => r.status === "accepted").length;
  const confirmed =
    mode === "demo"
      ? roles.reduce(
          (sum, _, i) =>
            sum + spring({ frame: frame - (FLIP_AT + i * FLIP_STAGGER), fps, config: { damping: 200 }, durationInFrames: 12 }),
          0
        )
      : target * spring({ frame: frame - (ENTER_AT + roles.length * STAGGER), fps, config: { damping: 200 } });
  const progress = total > 0 ? confirmed / total : 0;

  const doneAt = mode === "demo" ? lastFlip + 14 : ENTER_AT + roles.length * STAGGER + 24;
  const fullyStaffed = mode === "demo" || (total > 0 && target === total);
  const done = fullyStaffed ? spring({ frame: frame - doneAt, fps, config: { damping: 10, stiffness: 170 } }) : 0;

  return (
    <AbsoluteFill className="bg-card text-card-foreground" style={{ padding: PAD, gap: SECTION_GAP }}>
      <div
        style={{
          height: HEADER,
          opacity: head,
          transform: `translateY(${interpolate(head, [0, 1], [-10, 0])}px)`,
        }}
      >
        <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>
        <p className="truncate text-xl font-semibold tracking-tight">
          {title} <span className="text-sm font-normal text-muted-foreground">· {when}</span>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${reelColumns(width)}, minmax(0, 1fr))`,
          gridAutoRows: CARD_H,
          gap: GAP,
        }}
      >
        {roles.map((role, i) => (
          <RoleCard key={`${role.name}-${i}`} role={role} index={i} mode={mode} />
        ))}
      </div>

      <div className="flex items-center gap-3" style={{ height: FOOTER, opacity: head }}>
        <p className="shrink-0 text-sm font-medium tabular-nums">
          {Math.round(confirmed)} of {total} confirmed
        </p>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", progress >= 0.999 ? "bg-green-500" : "bg-primary")}
            style={{ width: `${Math.min(progress, 1) * 100}%` }}
          />
        </div>
        {fullyStaffed ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400"
            style={{ opacity: Math.min(done, 1), transform: `scale(${interpolate(done, [0, 1], [0.5, 1])})` }}
          >
            <Check className="size-3.5" /> Fully staffed
          </span>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
