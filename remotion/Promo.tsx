import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Html5Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
  Backdrop,
  Bell,
  Check,
  Chip,
  Confetti,
  Cursor,
  duckedMusic,
  Logo,
  MailIcon,
  Mascot,
  PASTEL,
  Phone,
  Rise,
  RoleBox,
  Sfx,
  type SfxName,
  Sub,
  TextIcon,
  Voice,
} from "./components";
import { C, GRADIENT, body, heading } from "./theme";

const T = 15; // transition length (frames)
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Each scene = 6f lead-in + its voice-over line + the transition overlap + a breath
export const PROMO_SCENES = [141, 194, 155, 191, 249, 191, 172, 158, 213, 191, 160, 187];
export const PROMO_DURATION = PROMO_SCENES.reduce((a, b) => a + b, 0) - T * (PROMO_SCENES.length - 1);

/** Left-hand headline + supporting line used by the feature scenes. */
function SceneText({ title, sub, size = 96 }: { title: string; sub: string; size?: number }) {
  return (
    <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, width: 760, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Rise text={title} size={size} />
      <Sub text={sub} delay={16} style={{ marginTop: 28, maxWidth: 700 }} />
    </div>
  );
}

export function Pop({ at, children, from = 0.6, style }: { at: number; children: ReactNode; from?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 160 } });
  return (
    <div style={{ opacity: Math.min(1, s * 1.4), transform: `scale(${interpolate(s, [0, 1], [from, 1])})`, ...style }}>{children}</div>
  );
}

/* 1 — Hook: Sunday's coming and the lineup is still full of question marks */
const SLOTS = ["Camera", "Sound", "Slides", "Livestream"];
function Hook() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop variant="dark" />
      <div style={{ position: "absolute", left: 160, top: 200 }}>
        <Rise text="Sunday is coming." size={128} color="white" />
        <Rise text="Is every role filled?" size={128} gradient delay={22} />
      </div>
      <div style={{ position: "absolute", left: 160, top: 640, display: "flex", gap: 22 }}>
        {SLOTS.map((name, i) => {
          const pulse = 1 + Math.max(0, Math.sin((frame - 50 - i * 6) / 6)) * 0.08;
          return (
            <Pop key={name} at={44 + i * 7}>
              <div style={{ width: 300, padding: "22px 24px", borderRadius: 24, border: "3px dashed rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", fontFamily: body, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{name}</span>
                <span style={{ width: 46, height: 46, borderRadius: "50%", background: PASTEL.pop, color: "white", fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulse})` }}>?</span>
              </div>
            </Pop>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 140, bottom: 90 }}>
        <Mascot src="full/girl_idea" height={430} delay={30} />
      </div>
    </AbsoluteFill>
  );
}

/* 2 — Chaos: the group chat explodes */
const BUBBLES = [
  { who: "Pastor Dan", text: "Who's on camera this Sunday?", x: 150, y: 290, at: 8, rot: -4 },
  { who: "Media Team", text: "Can anyone cover sound??", x: 1080, y: 250, at: 22, rot: 3 },
  { who: "Ana", text: "I'm out of town this week, sorry!", x: 250, y: 520, at: 36, rot: 2 },
  { who: "Pastor Dan", text: "Did Josh ever confirm?", x: 1150, y: 480, at: 50, rot: -3 },
  { who: "Ken", text: "Is the livestream link up yet?", x: 700, y: 640, at: 64, rot: 2 },
  { who: "Shared drive", text: "schedule_v7_FINAL (2).xlsx", x: 90, y: 800, at: 78, rot: -2 },
  { who: "Grace", text: "Wait, who's on slides?", x: 1230, y: 780, at: 92, rot: 4 },
];
function Chaos() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shake = frame > 110 ? Math.sin(frame * 1.7) * 5 : 0;
  const unread = Math.round(interpolate(frame, [8, 150], [0, 47], clamp));
  const badge = spring({ frame: frame - 8, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <Backdrop variant="dark" />
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center" }}>
        <Rise text="Group chats. Spreadsheets. Last-minute gaps." size={62} color="white" style={{ display: "inline-block" }} />
      </div>
      <div style={{ position: "absolute", right: 70, top: 168, display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderRadius: 999, background: C.red, color: "white", fontFamily: body, fontWeight: 700, fontSize: 30, transform: `scale(${badge})`, boxShadow: "0 16px 40px rgba(220,38,38,0.45)" }}>
        <TextIcon size={30} color="white" />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{unread} unread</span>
      </div>
      {BUBBLES.map((b) => {
        const s = spring({ frame: frame - b.at, fps, config: { damping: 11, stiffness: 150 } });
        return (
          <div
            key={b.text}
            style={{
              position: "absolute",
              left: b.x,
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

/* 3 — Reveal: Declare bursts in */
function Reveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const rays = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      {/* Slowly turning sunburst behind the logo */}
      <div
        style={{
          position: "absolute",
          left: 960 - 900,
          top: 470 - 900,
          width: 1800,
          height: 1800,
          borderRadius: "50%",
          opacity: rays * 0.55,
          transform: `rotate(${frame * 0.25}deg) scale(${0.6 + rays * 0.4})`,
          background: `repeating-conic-gradient(from 0deg, ${PASTEL.sky} 0deg 10deg, transparent 10deg 20deg)`,
          maskImage: "radial-gradient(circle, black 0%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 60%)",
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Logo size={170} />
          <span style={{ fontFamily: heading, fontWeight: 700, fontSize: 190, color: C.ink, letterSpacing: -6, opacity: word, transform: `translateX(${(1 - word) * 40}px)` }}>
            Declare
          </span>
        </div>
        <Sub text="Volunteer scheduling made for church teams" delay={24} size={46} />
      </AbsoluteFill>
      <Confetti at={12} x={960} y={420} count={80} />
      <div style={{ position: "absolute", right: 70, bottom: 70 }}>
        <Mascot src="full/duo_laptop" height={340} delay={30} />
      </div>
    </AbsoluteFill>
  );
}

/* 4 — How it works: three steps joined by a line that draws itself */
const STEPS = [
  { n: 1, title: "Plan the service", sticker: "full/duo_laptop", tone: PASTEL.sky, at: 40 },
  { n: 2, title: "Invite your team", sticker: "full/boy_headset_walkie", tone: PASTEL.butter, at: 78 },
  { n: 3, title: "Walk in ready", sticker: "full/duo_thumbs_peace", tone: PASTEL.mint, at: 116 },
];
function Steps() {
  const frame = useCurrentFrame();
  const CARD = 470;
  const GAP = 110;
  const left0 = (1920 - (CARD * 3 + GAP * 2)) / 2;
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
        <Rise text="How Declare works" size={92} style={{ display: "inline-block" }} />
      </div>
      {/* Connector lines between the cards */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[0, 1].map((i) => {
          const x1 = left0 + (CARD + GAP) * i + CARD + 10;
          const x2 = x1 + GAP - 20;
          const p = interpolate(frame, [STEPS[i + 1].at - 14, STEPS[i + 1].at + 4], [0, 1], clamp);
          return <line key={i} x1={x1} y1={600} x2={x1 + (x2 - x1) * p} y2={600} stroke={C.primary} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 16" />;
        })}
      </svg>
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ position: "absolute", left: left0 + i * (CARD + GAP), top: 330, width: CARD }}>
          <Pop at={s.at}>
            <div style={{ position: "relative", height: 540, borderRadius: 40, background: s.tone, border: "4px solid white", boxShadow: "0 30px 70px -30px rgba(36,91,255,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 30px 44px", fontFamily: body }}>
              <span style={{ position: "absolute", left: 28, top: 28, width: 64, height: 64, borderRadius: 20, background: GRADIENT, color: "white", fontWeight: 700, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</span>
              <div style={{ position: "absolute", top: 40 }}>
                <Mascot src={s.sticker} height={250} delay={s.at + 4} />
              </div>
              <div style={{ fontFamily: heading, fontSize: 44, fontWeight: 700, color: C.ink, textAlign: "center", lineHeight: 1.1 }}>{s.title}</div>
            </div>
          </Pop>
        </div>
      ))}
    </AbsoluteFill>
  );
}

/* 5 — Plan: the service flow builds itself and the running time adds up */
const PLAN = [
  { title: "Welcome & Announcements", mins: 5, tone: PASTEL.sky, at: 34 },
  { title: "Worship Set", mins: 20, tone: PASTEL.lilac, at: 70, songs: ["Way Maker", "Goodness of God", "Build My Life"] },
  { title: "Scripture Reading", mins: 5, tone: PASTEL.butter, at: 112 },
  { title: "Sermon", mins: 30, tone: PASTEL.peach, at: 146 },
  { title: "Response & Prayer", mins: 5, tone: PASTEL.mint, at: 180 },
];
function Plan() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const total = PLAN.reduce((sum, item) => sum + item.mins * spring({ frame: frame - item.at, fps, config: { damping: 200 }, durationInFrames: 18 }), 0);
  const mins = Math.round(total);
  const totalLabel = mins >= 60 ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m` : `${mins}m`;
  // Card spans x 1000–1800, y 120–960; "+ Add item" sits at its foot
  const add = { x: 1400, y: 905 };
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <SceneText title="Build the service plan" sub="Songs, sermon and every segment, with the running time added up for you." />
      <div style={{ position: "absolute", left: 1000, top: 120, width: 800, height: 840, opacity: card, transform: `translateY(${(1 - card) * 30}px)`, fontFamily: body }}>
        <div style={{ height: "100%", borderRadius: 36, background: "white", border: `3px solid ${C.border}`, boxShadow: "0 40px 90px -30px rgba(36,91,255,0.35)", padding: 34, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.primary, letterSpacing: 2, textTransform: "uppercase" }}>Service plan</div>
              <div style={{ fontFamily: heading, fontSize: 40, fontWeight: 700, color: C.ink }}>Sunday Worship</div>
            </div>
            <div style={{ fontSize: 26, color: C.muted }}>
              Total <span style={{ fontFamily: heading, fontSize: 44, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{totalLabel}</span>
            </div>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {PLAN.map((item) => {
              const s = spring({ frame: frame - item.at, fps, config: { damping: 14, stiffness: 140 } });
              if (frame < item.at) return null;
              return (
                <div key={item.title} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 20px", borderRadius: 22, background: item.tone, opacity: Math.min(1, s * 1.3), transform: `translateX(${(1 - s) * 60}px)` }}>
                  <span style={{ width: 10, alignSelf: "stretch", borderRadius: 999, background: "rgba(19,27,38,0.15)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: C.ink }}>{item.title}</div>
                    {item.songs ? (
                      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        {item.songs.map((song, j) => (
                          <Pop key={song} at={item.at + 10 + j * 7}>
                            <span style={{ padding: "6px 14px", borderRadius: 999, background: "white", fontSize: 19, fontWeight: 600, color: C.ink }}>♪ {song}</span>
                          </Pop>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 26, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{item.mins} min</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "auto", alignSelf: "center", padding: "14px 30px", borderRadius: 999, border: `3px dashed ${C.primary}`, color: C.primary, fontWeight: 700, fontSize: 24 }}>+ Add item</div>
        </div>
      </div>
      <Cursor
        path={[
          { at: 0, x: 1620, y: 1040 },
          { at: 24, x: add.x, y: add.y },
          ...PLAN.flatMap((item) => [{ at: item.at - 6, x: add.x, y: add.y }, { at: item.at - 4, x: add.x, y: add.y, click: true }]),
          { at: 214, x: add.x + 140, y: add.y + 60 },
        ]}
      />
    </AbsoluteFill>
  );
}

/* 6 — Schedule: click "+ Add Person", pick from the list, the row slides in */
const ASSIGN = [
  { role: "Main Cam CH 1", mascot: "crew_tripod", person: "Joshua Perez", pick: ["Joshua Perez", "Ken Dizon", "Mia Tan"], click: 40, addY: 303 },
  { role: "Sound Engineer", mascot: "crew_audio", person: "Paolo Cruz", pick: ["Grace Lim", "Paolo Cruz", "Ana Reyes"], click: 86, addY: 585 },
  { role: "Livestream", mascot: "crew_live", person: "Ana Reyes", pick: ["Ana Reyes", "Joshua Perez", "Ken Dizon"], click: 132, addY: 867 },
];
function Schedule() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <SceneText title="Assign every role" sub="Cameras, sound, slides: pick who serves in a couple of clicks." />
      <div style={{ position: "absolute", left: 1000, top: 170, width: 820, display: "grid", gap: 24 }}>
        {ASSIGN.map((a, i) => (
          <RoleBox key={a.role} name={a.role} mascot={a.mascot} scale={1.1} enterAt={6 + i * 6} rows={[{ name: a.person, status: "invited", appearAt: a.click + 22 }]} />
        ))}
      </div>
      {/* Person picker that opens under the clicked "+ Add Person" */}
      {ASSIGN.map((a) => {
        const open = spring({ frame: frame - a.click, fps, config: { damping: 14, stiffness: 180 } });
        if (frame < a.click || frame > a.click + 22) return null;
        const chosen = a.pick.indexOf(a.person);
        return (
          <div key={a.role} style={{ position: "absolute", left: 1250, top: a.addY + 30, width: 360, padding: 10, borderRadius: 20, background: "white", boxShadow: "0 30px 60px rgba(15,23,42,0.25)", border: `2px solid ${C.border}`, fontFamily: body, transform: `scale(${open})`, transformOrigin: "50% 0", zIndex: 20 }}>
            {a.pick.map((p, j) => (
              <div key={p} style={{ padding: "12px 16px", borderRadius: 12, fontSize: 24, fontWeight: 600, color: j === chosen && frame > a.click + 10 ? "white" : C.ink, background: j === chosen && frame > a.click + 10 ? C.primary : "transparent" }}>{p}</div>
            ))}
          </div>
        );
      })}
      <Cursor
        path={[
          { at: 0, x: 1650, y: 1040 },
          ...ASSIGN.flatMap((a) => [
            { at: a.click - 12, x: 1410, y: a.addY },
            { at: a.click, x: 1410, y: a.addY, click: true },
            { at: a.click + 12, x: 1360, y: a.addY + 30 + 26 + a.pick.indexOf(a.person) * 52, click: true },
          ]),
          { at: 180, x: 1560, y: 1000 },
        ]}
      />
    </AbsoluteFill>
  );
}

/* 7 — Blockouts: a volunteer marks a day off; Declare flags it and suggests someone free */
function Blockouts() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const BLOCK_AT = 40;
  const blockPop = spring({ frame: frame - BLOCK_AT, fps, config: { damping: 10, stiffness: 180 } });
  const flag = spring({ frame: frame - 76, fps, config: { damping: 12 } });
  const swap = spring({ frame: frame - 112, fps, config: { damping: 12 } });
  // October 2026 starts on a Thursday
  const cells = Array.from({ length: 35 }, (_, i) => i - 3);
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <SceneText title="Blockout dates, respected" sub="Volunteers mark their days off. Declare flags the conflict and points you to someone free." size={92} />
      <div style={{ position: "absolute", left: 1000, top: 110, width: 780, opacity: card, transform: `translateY(${(1 - card) * 30}px)`, fontFamily: body }}>
        <div style={{ background: "white", borderRadius: 30, padding: 30, border: `3px solid ${C.border}`, boxShadow: "0 40px 90px -30px rgba(36,91,255,0.35)" }}>
          <div style={{ fontFamily: heading, fontSize: 34, fontWeight: 700, color: C.ink, marginBottom: 16 }}>October 2026</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 18, fontWeight: 600, color: C.muted }}>{d}</div>
            ))}
            {cells.map((d) => {
              const blocked = d === 25 && frame >= BLOCK_AT;
              const inMonth = d >= 1 && d <= 31;
              return (
                <div
                  key={d}
                  style={{
                    height: 64,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: blocked ? 700 : 500,
                    color: !inMonth ? "transparent" : blocked ? C.red : C.ink,
                    background: blocked ? `repeating-linear-gradient(135deg, ${C.redBg} 0 10px, #fecaca 10px 20px)` : inMonth ? "#f6f8fb" : "transparent",
                    outline: blocked ? `3px solid ${C.red}` : undefined,
                    transform: blocked ? `scale(${interpolate(blockPop, [0, 1], [1.35, 1])})` : undefined,
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 18, background: "white", borderRadius: 24, padding: "16px 24px", border: `3px solid ${C.border}`, opacity: flag, transform: `translateY(${(1 - flag) * 24}px)` }}>
          <Mascot src="full/boy_running" height={84} delay={76} float={false} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.ink, textDecoration: frame > 112 ? "line-through" : "none" }}>Grace Lim · Slides &amp; Lyrics</div>
            <div style={{ fontSize: 18, color: C.muted }}>Away Sunday, Oct 25</div>
          </div>
          <span style={{ marginLeft: "auto" }}>
            <Chip status="unavailable" size={20} popAt={82} />
          </span>
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 18, background: PASTEL.mint, borderRadius: 24, padding: "18px 24px", border: "3px solid white", opacity: swap, transform: `translateX(${(1 - swap) * 60}px)` }}>
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.green, fontSize: 20 }}>MT</span>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.ink }}>Mia Tan is free that Sunday</div>
            <div style={{ fontSize: 18, color: C.green, fontWeight: 600 }}>Suggested instead</div>
          </div>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "white", color: C.green, fontWeight: 700, fontSize: 20 }}>
            <Check size={20} /> Available
          </span>
        </div>
      </div>
      <Cursor
        path={[
          { at: 0, x: 1500, y: 1040 },
          { at: 30, x: 1078, y: 552 },
          { at: BLOCK_AT, x: 1078, y: 552, click: true },
          { at: 70, x: 1240, y: 760 },
          { at: 104, x: 1640, y: 880 },
          { at: 112, x: 1640, y: 880, click: true },
        ]}
      />
    </AbsoluteFill>
  );
}

/** The volunteer's phone: invite notification, then the respond screen with Accept. */
export function RespondScreen({ tapAt, notifAt = 6 }: { tapAt: number; notifAt?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const notif = spring({ frame: frame - notifAt, fps, config: { damping: 14 } });
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
            transform: `scale(${interpolate(tapSince, [-4, 0, 18], [0.6, 1, 1.8], clamp)})`,
            opacity: interpolate(tapSince, [-4, 0, 18], [0.8, 1, 0], clamp),
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

/* 8 — Invite: an email and a text fly to the volunteer's phone; one tap to accept */
function FlyingIcon({ at, from, to, tone, children }: { at: number; from: [number, number]; to: [number, number]; tone: string; children: ReactNode }) {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [at - 16, at - 6], [0, 1], clamp);
  const p = interpolate(frame, [at, at + 22], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * 220;
  const gone = frame > at + 22;
  return (
    <div style={{ position: "absolute", left: x - 48, top: y - 48, width: 96, height: 96, borderRadius: 28, background: tone, border: "4px solid white", boxShadow: "0 20px 40px rgba(15,23,42,0.25)", display: "flex", alignItems: "center", justifyContent: "center", opacity: gone ? 0 : appear, transform: `scale(${1 - p * 0.55}) rotate(${p * 25}deg)` }}>
      {children}
    </div>
  );
}
function Invite() {
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <SceneText title="Invites by email" sub="Volunteers get the invite on their phone and accept with a single tap." size={92} />
      <FlyingIcon at={18} from={[300, 820]} to={[1370, 230]} tone={PASTEL.sky}><MailIcon size={46} color={C.primary} /></FlyingIcon>
      <div style={{ position: "absolute", left: 1170, top: 130 }}>
        <RespondScreen tapAt={112} notifAt={40} />
      </div>
      <Confetti at={114} x={1370} y={560} count={45} spread={0.7} />
      <div style={{ position: "absolute", right: 60, bottom: 50 }}>
        <Mascot src="full/boy_thumbs_tablet" height={260} delay={118} />
      </div>
    </AbsoluteFill>
  );
}

/* 9 — Reminders: a timeline to Sunday with the bell ringing at each nudge */
const MILESTONES = [
  { label: "Invite sent", day: "Mon", x: 300 },
  { label: "3 days before", day: "Thu", x: 760, bell: true },
  { label: "1 day before", day: "Sat", x: 1220, bell: true },
  { label: "Sunday", day: "Sun", x: 1660 },
];
export function Reminders({ header }: { header?: ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const LINE_Y = 760;
  const progress = interpolate(frame, [28, 176], [MILESTONES[0].x, MILESTONES[3].x], clamp);
  const reachAt = (x: number) => Math.round(interpolate(x, [MILESTONES[0].x, MILESTONES[3].x], [28, 176]));
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      {header ?? (
        <div style={{ position: "absolute", left: 130, top: 110, width: 1300 }}>
          <Rise text="Friendly reminders, automatically" size={86} />
          <Sub text="Anyone who hasn't replied gets a nudge by email and text: 3 days and 1 day before." delay={16} style={{ marginTop: 22, maxWidth: 1100 }} />
        </div>
      )}
      <div style={{ position: "absolute", left: MILESTONES[0].x, top: LINE_Y - 5, width: MILESTONES[3].x - MILESTONES[0].x, height: 10, borderRadius: 999, background: "#dde5ef" }} />
      <div style={{ position: "absolute", left: MILESTONES[0].x, top: LINE_Y - 5, width: progress - MILESTONES[0].x, height: 10, borderRadius: 999, background: GRADIENT }} />
      {MILESTONES.map((m, i) => {
        const at = reachAt(m.x);
        const hit = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 180 } });
        const reached = frame >= at;
        const last = i === MILESTONES.length - 1;
        return (
          <div key={m.label}>
            <div style={{ position: "absolute", left: m.x - 34, top: LINE_Y - 34, width: 68, height: 68, borderRadius: "50%", background: reached ? (last ? "#22c55e" : C.primary) : "white", border: `5px solid ${reached ? "white" : "#dde5ef"}`, boxShadow: reached ? "0 12px 30px rgba(36,91,255,0.35)" : "none", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${reached ? interpolate(hit, [0, 1], [1.4, 1]) : 1})` }}>
              {m.bell ? <Bell size={30} color={reached ? "white" : C.muted} ringAt={at} /> : last && reached ? <Check size={30} color="white" /> : <span style={{ width: 14, height: 14, borderRadius: "50%", background: reached ? "white" : "#dde5ef" }} />}
            </div>
            <div style={{ position: "absolute", left: m.x - 140, top: LINE_Y + 50, width: 280, textAlign: "center", fontFamily: body }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.ink }}>{m.label}</div>
              <div style={{ fontSize: 22, color: C.muted }}>{m.day}</div>
            </div>
            {m.bell ? (
              <div style={{ position: "absolute", left: m.x - 200, top: LINE_Y - 250, width: 400, opacity: Math.min(1, hit * 1.3), transform: `translateY(${(1 - hit) * 30}px) scale(${interpolate(hit, [0, 1], [0.8, 1])})`, transformOrigin: "50% 100%" }}>
                <div style={{ padding: "18px 22px", borderRadius: 24, background: "white", border: `3px solid ${i === 1 ? PASTEL.butter : PASTEL.blush}`, boxShadow: "0 24px 50px -20px rgba(36,91,255,0.4)", fontFamily: body }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, color: C.primary }}>
                    <MailIcon size={22} color={C.primary} /> <TextIcon size={22} color={PASTEL.pop} /> REMINDER
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginTop: 6 }}>Main Cam CH 1 · Sunday Worship</div>
                  <div style={{ fontSize: 19, color: C.muted }}>{i === 1 ? "3 days to go. Can you make it?" : "Tomorrow at 9:00 AM. See you there!"}</div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {frame >= reachAt(MILESTONES[3].x) ? (
        <div style={{ position: "absolute", left: MILESTONES[3].x - 110, top: LINE_Y - 330 }}>
          <Mascot src="full/boy_running" height={230} delay={reachAt(MILESTONES[3].x)} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

/* 10 — Team: chat bubbles type in, then the weekly devotional slides up */
const CHAT = [
  { who: "Pastor Dan", text: "Call time is 7:30 AM this Sunday.", at: 22, mine: false },
  { who: "Joshua", text: "On it! Cameras are charged.", at: 56, mine: true },
  { who: "Ana", text: "Stream test at 8:00 sharp.", at: 90, mine: false },
];
function Team() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const devo = spring({ frame: frame - 118, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <SceneText title="Team chat & devotionals" sub="Message a whole team at once, and share a weekly devotional to keep everyone encouraged." size={92} />
      <div style={{ position: "absolute", left: 1000, top: 90, width: 780, opacity: card, transform: `translateY(${(1 - card) * 30}px)`, fontFamily: body }}>
        <div style={{ background: "white", borderRadius: 32, border: `3px solid ${C.border}`, boxShadow: "0 40px 90px -30px rgba(36,91,255,0.35)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 26px", borderBottom: `2px solid ${C.border}` }}>
            <Mascot src="full/boy_headset_walkie" height={64} delay={6} float={false} />
            <div style={{ fontFamily: heading, fontSize: 32, fontWeight: 700, color: C.ink }}>Media Team</div>
            <span style={{ marginLeft: "auto", fontSize: 18, color: C.muted }}>12 members</span>
          </div>
          <div style={{ padding: 26, display: "grid", gap: 18, minHeight: 360, alignContent: "start" }}>
            {CHAT.map((m) => {
              if (frame < m.at) return null;
              const typing = frame < m.at + 16;
              const s = spring({ frame: frame - m.at, fps, config: { damping: 14, stiffness: 160 } });
              return (
                <div key={m.text} style={{ justifySelf: m.mine ? "end" : "start", maxWidth: 560, transform: `scale(${s})`, transformOrigin: m.mine ? "100% 100%" : "0 100%" }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: C.muted, marginBottom: 4, textAlign: m.mine ? "right" : "left" }}>{m.who}</div>
                  <div style={{ padding: "14px 22px", borderRadius: 24, background: m.mine ? C.primary : "#eef2fb", color: m.mine ? "white" : C.ink, fontSize: 26, fontWeight: 500 }}>
                    {typing ? (
                      <span style={{ display: "inline-flex", gap: 8 }}>
                        {[0, 1, 2].map((d) => (
                          <span key={d} style={{ width: 12, height: 12, borderRadius: "50%", background: m.mine ? "white" : C.muted, opacity: 0.4 + 0.6 * Math.max(0, Math.sin((frame - m.at) / 3 - d)) }} />
                        ))}
                      </span>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 24, padding: "26px 30px", borderRadius: 30, background: GRADIENT, color: "white", opacity: Math.min(1, devo * 1.3), transform: `translateY(${(1 - devo) * 80}px)`, boxShadow: "0 30px 60px -20px rgba(36,91,255,0.5)" }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, opacity: 0.85 }}>WEEKLY DEVOTIONAL · ROMANS 12:6</div>
          <div style={{ fontFamily: heading, fontSize: 38, fontWeight: 700, marginTop: 6 }}>Serve According to Your Gift</div>
          <div style={{ fontSize: 20, opacity: 0.85, marginTop: 4 }}>Sent to the whole team every Sunday at 6:00 AM</div>
          <div style={{ position: "absolute", right: -30, top: -90 }}>
            <Mascot src="full/duo_hug" height={170} delay={124} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* 11 — Staffed: every role flips to Confirmed, confetti */
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
  const doneAt = flipAt(CREW.length - 1) + 14;
  const done = spring({ frame: frame - doneAt, fps, config: { damping: 10, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <AbsoluteFill style={{ padding: "90px 130px", gap: 40 }}>
        <Rise text="Sunday, fully staffed." size={104} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {CREW.map(([name, mascot], i) => {
            const enter = spring({ frame: frame - i * 3, fps, config: { damping: 200 } });
            const glow = interpolate(frame - flipAt(i), [0, 5, 24], [0, 1, 0], clamp);
            return (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "18px 22px",
                  borderRadius: 26,
                  background: "white",
                  border: `3px solid ${frame >= flipAt(i) ? "#bbf7d0" : C.border}`,
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
      <Confetti at={doneAt} x={1600} y={860} count={90} />
      <div style={{ position: "absolute", right: 30, top: 28 }}>
        <Mascot src="full/duo_hug" height={190} delay={doneAt - 4} />
      </div>
    </AbsoluteFill>
  );
}

/* 12 — Call to action */
export function CallToAction({ headline = "Run your church without the spreadsheet.", badges }: { headline?: string; badges?: string[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const btn = spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 160 } });
  const glow = 0.5 + Math.sin(frame / 8) * 0.5;
  return (
    <AbsoluteFill>
      <Backdrop variant="brand" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, padding: "0 300px", textAlign: "center" }}>
        <Logo size={130} />
        <Rise text={headline} size={96} color="white" style={{ textAlign: "center" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${btn})`, opacity: Math.min(1, btn) }}>
          <span style={{ padding: "24px 48px", borderRadius: 999, background: "white", color: C.primary, fontFamily: body, fontWeight: 700, fontSize: 38, boxShadow: `0 24px 50px rgba(10,18,34,0.25), 0 0 0 ${10 * glow}px rgba(255,255,255,0.25)` }}>
            Get started free
          </span>
          <span style={{ fontFamily: body, fontWeight: 600, fontSize: 34, color: "white" }}>declare-cyan.vercel.app</span>
        </div>
        {badges ? (
          <div style={{ display: "flex", gap: 16 }}>
            {badges.map((b, i) => (
              <Pop key={b} at={48 + i * 8}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 999, background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.45)", color: "white", fontFamily: body, fontWeight: 600, fontSize: 26 }}>
                  <Check size={22} /> {b}
                </span>
              </Pop>
            ))}
          </div>
        ) : null}
      </AbsoluteFill>
      <Confetti at={34} x={960} y={700} count={60} spread={0.8} />
      <div style={{ position: "absolute", left: 70, bottom: 30 }}>
        <Mascot src="full/boy_thumbs_tablet" height={420} delay={18} />
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 60 }}>
        <Mascot src="full/girl_tablet_wave" height={330} delay={26} />
      </div>
    </AbsoluteFill>
  );
}

const SCENES = [Hook, Chaos, Reveal, Steps, Plan, Schedule, Blockouts, Invite, Reminders, Team, Staffed, CallToAction];

// Sound effects per scene: [effect, scene-relative frame, volume], timed to each animation beat
type Hit = [SfxName, number, number];
const hits = (name: SfxName, ats: number[], volume: number): Hit[] => ats.map((at) => [name, at, volume]);
const SCENE_SFX: Hit[][] = [
  [["pop", 30, 0.3], ...hits("pop", [44, 51, 58, 65], 0.28)],
  hits("bloop", BUBBLES.map((b) => b.at), 0.35),
  [["confetti", 12, 0.45], ["pop", 30, 0.25]],
  [["whoosh", 0, 0.18], ...hits("pop", STEPS.map((s) => s.at), 0.4)],
  [["whoosh", 0, 0.18], ...hits("click", PLAN.map((p) => p.at - 4), 0.5), ...hits("pop", PLAN.map((p) => p.at), 0.2)],
  [
    ["whoosh", 0, 0.18],
    ...hits("click", ASSIGN.flatMap((a) => [a.click, a.click + 12]), 0.5),
    ...hits("pop", ASSIGN.map((a) => a.click + 22), 0.22),
  ],
  [["whoosh", 0, 0.18], ["click", 40, 0.5], ["pop", 76, 0.3], ["click", 112, 0.5], ["success", 114, 0.3]],
  [["whoosh", 0, 0.18], ["whoosh", 18, 0.35], ["ding", 40, 0.5], ["click", 112, 0.5], ["success", 114, 0.45], ["confetti", 114, 0.3]],
  [["whoosh", 0, 0.18], ["bell", 78, 0.45], ["bell", 128, 0.45], ["success", 176, 0.45]],
  [["whoosh", 0, 0.2], ...hits("bloop", CHAT.map((m) => m.at + 16), 0.4), ["whoosh", 118, 0.25]],
  [...hits("pop", CREW.map((_, i) => 26 + i * 8), 0.22), ["confetti", 80, 0.5], ["success", 80, 0.4]],
  [["pop", 30, 0.35], ["confetti", 34, 0.35]],
];

// Background music ducks under each voice-over line and swells between them
const VO_FRAMES = [106, 159, 120, 156, 214, 156, 137, 123, 178, 156, 125, 152];
const musicVolume = duckedMusic(PROMO_SCENES, VO_FRAMES, T);

export function Promo() {
  const t = linearTiming({ durationInFrames: T });
  // Mood changes fade; the feature walkthrough slides; the team scene wipes in
  const transitionFor = (i: number, key: string) => {
    if (i <= 2 || i === 10) return <TransitionSeries.Transition key={key} presentation={fade()} timing={t} />;
    if (i === 9) return <TransitionSeries.Transition key={key} presentation={wipe({ direction: "from-left" })} timing={t} />;
    return <TransitionSeries.Transition key={key} presentation={slide({ direction: "from-right" })} timing={t} />;
  };
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {SCENES.flatMap((Scene, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={PROMO_SCENES[i]}>
              <Scene />
              <Voice name={`promo-${i + 1}`} />
              {SCENE_SFX[i].map(([name, at, volume], k) => (
                <Sfx key={k} name={name} at={at} volume={volume} />
              ))}
            </TransitionSeries.Sequence>,
          ];
          if (i < SCENES.length - 1) {
            items.push(transitionFor(i + 1, `t${i}`));
          }
          return items;
        })}
      </TransitionSeries>
      <Html5Audio src={staticFile("videos/music/promo-bed.mp3")} volume={musicVolume} />
    </AbsoluteFill>
  );
}
