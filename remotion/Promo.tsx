import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Backdrop, Check, Chip, Logo, Mascot, Phone, Rise, RoleBox, Sub, Voice } from "./components";
import { C, GRADIENT, body, heading } from "./theme";

const T = 15; // transition length (frames)
// Each scene is long enough for its voice-over line (audio + 6f lead-in + transition overlap)
export const PROMO_SCENES = [113, 145, 140, 150, 176, 135, 120, 160];
export const PROMO_DURATION = PROMO_SCENES.reduce((a, b) => a + b, 0) - T * (PROMO_SCENES.length - 1);

function TwoColumn({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 130px", gap: 80 }}>
      <div style={{ flex: "0 0 760px" }}>{left}</div>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>{right}</div>
    </AbsoluteFill>
  );
}

function Hook() {
  return (
    <AbsoluteFill>
      <Backdrop variant="dark" />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 160px" }}>
        <Rise text="Sunday is coming." size={132} color="white" />
        <Rise text="Is every role filled?" size={132} gradient delay={22} />
      </AbsoluteFill>
      <div style={{ position: "absolute", right: 150, bottom: 110 }}>
        <Mascot src="idea" height={430} delay={34} />
      </div>
    </AbsoluteFill>
  );
}

const BUBBLES = [
  { who: "Pastor Dan", text: "Who's on camera this Sunday?", x: 170, y: 290, at: 6, rot: -4 },
  { who: "Media Team", text: "Can anyone cover sound??", x: 1060, y: 250, at: 16, rot: 3 },
  { who: "Ana", text: "I'm out of town this week, sorry!", x: 260, y: 540, at: 26, rot: 2 },
  { who: "Pastor Dan", text: "Did Josh ever confirm?", x: 1130, y: 500, at: 36, rot: -3 },
  { who: "Shared drive", text: "schedule_v7_FINAL (2).xlsx", x: 560, y: 760, at: 46, rot: -2 },
  { who: "Grace", text: "Wait, who's on slides?", x: 1210, y: 760, at: 56, rot: 4 },
];

function Chaos() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shake = frame > 72 ? Math.sin(frame * 1.7) * 4 : 0;
  return (
    <AbsoluteFill>
      <Backdrop variant="dark" />
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center" }}>
        <Rise text="Group chats. Spreadsheets. Last-minute gaps." size={64} color="white" style={{ display: "inline-block" }} />
      </div>
      {BUBBLES.map((b) => {
        const s = spring({ frame: frame - b.at, fps, config: { damping: 11, stiffness: 150 } });
        return (
          <div
            key={b.text}
            style={{
              position: "absolute",
              left: b.x + shake,
              top: b.y,
              transform: `scale(${s}) rotate(${b.rot}deg)`,
              opacity: Math.min(1, s * 1.4),
              padding: "22px 30px",
              borderRadius: 28,
              borderBottomLeftRadius: 8,
              background: "white",
              boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
              fontFamily: body,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 600, color: C.primary }}>{b.who}</div>
            <div style={{ fontSize: 34, fontWeight: 500, color: C.ink }}>{b.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Reveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Logo size={170} />
          <span style={{ fontFamily: heading, fontWeight: 700, fontSize: 190, color: C.ink, letterSpacing: -6, opacity: word, transform: `translateX(${(1 - word) * 40}px)` }}>
            Declare
          </span>
        </div>
        <Sub text="Volunteer scheduling for church teams" delay={24} size={46} />
      </AbsoluteFill>
      <div style={{ position: "absolute", right: 40, bottom: -10 }}>
        <Mascot src="hero_thumbsup" height={420} delay={30} />
      </div>
    </AbsoluteFill>
  );
}

function Schedule() {
  return (
    <AbsoluteFill>
      <Backdrop />
      <TwoColumn
        left={
          <>
            <Rise text="Schedule every role" size={104} />
            <Sub text="Assign volunteers to each role in a few taps, and see every team's lineup at a glance." delay={18} style={{ marginTop: 28, maxWidth: 680 }} />
          </>
        }
        right={
          <div style={{ width: 880, display: "grid", gap: 24 }}>
            <RoleBox name="Main Cam CH 1" mascot="crew_tripod" scale={1.15} enterAt={8} rows={[{ name: "Joshua Perez", status: "invited", appearAt: 40 }]} />
            <RoleBox name="Sound Engineer" mascot="crew_audio" scale={1.15} enterAt={18} rows={[{ name: "Paolo Cruz", status: "invited", appearAt: 56 }]} />
            <RoleBox name="Livestream" mascot="crew_live" scale={1.15} enterAt={28} rows={[{ name: "Ana Reyes", status: "invited", appearAt: 72 }]} />
          </div>
        }
      />
    </AbsoluteFill>
  );
}

/** The volunteer's phone: invite notification, then the respond screen with Accept. */
export function RespondScreen({ tapAt }: { tapAt: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const notif = spring({ frame: frame - 6, fps, config: { damping: 14 } });
  const openAt = tapAt - 50;
  const screen = spring({ frame: frame - openAt, fps, config: { damping: 200 } });
  const accepted = frame >= tapAt;
  const toast = spring({ frame: frame - tapAt - 6, fps, config: { damping: 14 } });
  const tapSince = frame - tapAt;
  return (
    <Phone>
      <div style={{ position: "absolute", inset: 0, background: GRADIENT, opacity: 1 - screen }} />
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          top: 70,
          padding: "18px 20px",
          borderRadius: 26,
          background: "rgba(255,255,255,0.94)",
          transform: `translateY(${(1 - notif) * -160}px)`,
          opacity: 1 - screen,
          fontFamily: body,
          boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}>DECLARE · now</div>
        <div style={{ fontSize: 21, fontWeight: 700, color: C.ink, marginTop: 4 }}>You&apos;re scheduled: Main Cam CH 1</div>
        <div style={{ fontSize: 17, color: C.muted, marginTop: 2 }}>Sunday Worship · Sun 9:00 AM — tap to respond</div>
      </div>
      <div style={{ position: "absolute", inset: 0, padding: "86px 22px 0", opacity: screen, transform: `translateY(${(1 - screen) * 40}px)`, fontFamily: body }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: -14, position: "relative", zIndex: 2 }}>
          <Mascot src="crew_tripod" height={170} delay={openAt + 4} float={false} />
        </div>
        <div style={{ background: "white", borderRadius: 26, padding: "34px 24px 24px", boxShadow: "0 14px 30px rgba(15,23,42,0.1)", border: `2px solid ${C.border}` }}>
          <div style={{ fontFamily: heading, fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.1 }}>Main Cam CH 1 — Sunday Worship</div>
          <div style={{ fontSize: 18, color: C.muted, marginTop: 8 }}>Sunday, Oct 25 · 9:00 AM</div>
          <div style={{ marginTop: 22 }}>
            {accepted ? (
              <Chip status="accepted" size={22} popAt={tapAt} />
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ flex: 1, textAlign: "center", padding: "16px 0", borderRadius: 16, background: "#16a34a", color: "white", fontWeight: 700, fontSize: 22 }}>Accept</span>
                <span style={{ flex: 1, textAlign: "center", padding: "16px 0", borderRadius: 16, border: "2px solid #fca5a5", color: C.red, fontWeight: 700, fontSize: 22 }}>Decline</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {tapSince >= -4 && tapSince < 18 ? (
        <span
          style={{
            position: "absolute",
            left: 104 - 34,
            top: 452 - 34,
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(22,163,74,0.35)",
            transform: `scale(${interpolate(tapSince, [-4, 0, 18], [0.6, 1, 1.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
            opacity: interpolate(tapSince, [-4, 0, 18], [0.8, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          bottom: 40,
          padding: "18px 20px",
          borderRadius: 18,
          background: C.ink,
          color: "white",
          fontFamily: body,
          fontWeight: 600,
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
          transform: `translateY(${(1 - toast) * 140}px)`,
          opacity: accepted ? 1 : 0,
        }}
      >
        <Check size={22} color="#4ade80" /> You&apos;re confirmed. See you there!
      </div>
    </Phone>
  );
}

function Invite() {
  return (
    <AbsoluteFill>
      <Backdrop />
      <TwoColumn
        left={
          <>
            <Rise text="Invites & reminders on autopilot" size={98} />
            <Sub text="Volunteers accept from their phone. Declare nudges anyone who hasn't replied." delay={18} style={{ marginTop: 28, maxWidth: 680 }} />
          </>
        }
        right={<RespondScreen tapAt={112} />}
      />
    </AbsoluteFill>
  );
}

function Blockouts() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const flag = spring({ frame: frame - 62, fps, config: { damping: 12 } });
  // October 2026 starts on a Thursday
  const cells = Array.from({ length: 35 }, (_, i) => i - 3);
  return (
    <AbsoluteFill>
      <Backdrop />
      <TwoColumn
        left={
          <>
            <Rise text="Blockout dates, respected" size={100} />
            <Sub text="Volunteers mark their days off. Declare flags the conflict before you send an invite." delay={18} style={{ marginTop: 28, maxWidth: 680 }} />
          </>
        }
        right={
          <div style={{ width: 800, opacity: card, transform: `translateY(${(1 - card) * 30}px)`, fontFamily: body }}>
            <div style={{ background: "white", borderRadius: 24, padding: 30, border: `2px solid ${C.border}`, boxShadow: "0 24px 50px rgba(15,23,42,0.1)" }}>
              <div style={{ fontFamily: heading, fontSize: 34, fontWeight: 700, color: C.ink, marginBottom: 16 }}>October 2026</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 18, fontWeight: 600, color: C.muted }}>{d}</div>
                ))}
                {cells.map((d) => {
                  const blocked = d === 25;
                  return (
                    <div
                      key={d}
                      style={{
                        height: 64,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: blocked ? 700 : 500,
                        color: d < 1 || d > 31 ? "transparent" : blocked ? C.red : C.ink,
                        background: blocked
                          ? `repeating-linear-gradient(135deg, ${C.redBg} 0 10px, #fecaca 10px 20px)`
                          : d >= 1 && d <= 31
                            ? "#f6f8fb"
                            : "transparent",
                        outline: blocked ? `3px solid ${C.red}` : undefined,
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 18, background: "white", borderRadius: 20, padding: "18px 24px", border: `2px solid ${C.border}`, opacity: flag, transform: `translateY(${(1 - flag) * 24}px)` }}>
              <Mascot src="mm_cables2" height={90} delay={62} float={false} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: C.ink }}>Grace Lim · Slides &amp; Lyrics</div>
                <div style={{ fontSize: 18, color: C.muted }}>Away Sunday, Oct 25</div>
              </div>
              <span style={{ marginLeft: "auto" }}>
                <Chip status="unavailable" size={20} popAt={70} />
              </span>
            </div>
          </div>
        }
      />
    </AbsoluteFill>
  );
}

const CREW = [
  ["Main Cam CH 1", "crew_tripod"],
  ["Livestream", "crew_live"],
  ["Sound Engineer", "crew_audio"],
  ["Slides & Lyrics", "laptop"],
  ["Photographer", "camera"],
  ["Media Director", "team_headset_mic"],
] as const;

function Staffed() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flipAt = (i: number) => 26 + i * 8;
  const confirmed = CREW.reduce((sum, _, i) => sum + spring({ frame: frame - flipAt(i), fps, config: { damping: 200 }, durationInFrames: 10 }), 0);
  const done = spring({ frame: frame - (flipAt(CREW.length - 1) + 14), fps, config: { damping: 10, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: "90px 130px", gap: 40 }}>
        <Rise text="Sunday, fully staffed." size={104} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {CREW.map(([name, mascot], i) => {
            const enter = spring({ frame: frame - i * 3, fps, config: { damping: 200 } });
            const glow = interpolate(frame - flipAt(i), [0, 5, 24], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "18px 22px",
                  borderRadius: 22,
                  background: "white",
                  border: `2px solid ${C.border}`,
                  boxShadow: `0 0 0 ${4 * glow}px rgba(34,197,94,${glow * 0.8}), 0 18px 40px rgba(15,23,42,0.08)`,
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 24}px)`,
                  fontFamily: body,
                }}
              >
                <Mascot src={mascot} height={104} delay={i * 3 + 4} float={false} />
                <div style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 600, color: C.ink }}>{name}</span>
                  <Chip status={frame >= flipAt(i) ? "accepted" : "invited"} size={19} popAt={frame >= flipAt(i) ? flipAt(i) : undefined} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 26, fontFamily: body }}>
          <span style={{ fontSize: 32, fontWeight: 600, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{Math.round(confirmed)} of 6 confirmed</span>
          <div style={{ flex: 1, height: 16, borderRadius: 999, background: "#dde5ef", overflow: "hidden" }}>
            <div style={{ width: `${(confirmed / 6) * 100}%`, height: "100%", borderRadius: 999, background: confirmed > 5.98 ? "#22c55e" : C.primary }} />
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 999, background: C.greenBg, color: C.green, fontWeight: 700, fontSize: 26, opacity: Math.min(1, done), transform: `scale(${interpolate(done, [0, 1], [0.5, 1])})` }}>
            <Check size={24} /> Fully staffed
          </span>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", right: 90, top: 40 }}>
        <Mascot src="cheer" height={240} delay={flipAt(CREW.length - 1) + 10} />
      </div>
    </AbsoluteFill>
  );
}

export function CallToAction({ headline = "Run your church without the spreadsheet." }: { headline?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const btn = spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <Backdrop variant="brand" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, padding: "0 300px", textAlign: "center" }}>
        <Logo size={130} />
        <Rise text={headline} size={96} color="white" style={{ textAlign: "center" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${btn})`, opacity: Math.min(1, btn) }}>
          <span style={{ padding: "24px 48px", borderRadius: 999, background: "white", color: C.primary, fontFamily: body, fontWeight: 700, fontSize: 38, boxShadow: "0 24px 50px rgba(10,18,34,0.25)" }}>
            Get started free
          </span>
          <span style={{ fontFamily: body, fontWeight: 600, fontSize: 34, color: "white" }}>declare-cyan.vercel.app</span>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 70, bottom: 30 }}>
        <Mascot src="hero_thumbsup" height={420} delay={18} />
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 60 }}>
        <Mascot src="waving" height={330} delay={26} />
      </div>
    </AbsoluteFill>
  );
}

export function Promo() {
  const [hook, chaos, reveal, schedule, invite, blockouts, staffed, cta] = PROMO_SCENES;
  const t = linearTiming({ durationInFrames: T });
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={hook}><Hook /><Voice name="promo-1" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence durationInFrames={chaos}><Chaos /><Voice name="promo-2" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence durationInFrames={reveal}><Reveal /><Voice name="promo-3" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={schedule}><Schedule /><Voice name="promo-4" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={invite}><Invite /><Voice name="promo-5" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={blockouts}><Blockouts /><Voice name="promo-6" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
      <TransitionSeries.Sequence durationInFrames={staffed}><Staffed /><Voice name="promo-7" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence durationInFrames={cta}><CallToAction /><Voice name="promo-8" /></TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
