import type { ReactNode } from "react";
import { AbsoluteFill, Html5Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  Backdrop,
  BrowserShot,
  Callout,
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
  RoleBox,
  Rise,
  Sfx,
  type SfxName,
  StepTag,
  Sub,
  Voice,
} from "./components";
import { CallToAction, Pop, Reminders, RespondScreen } from "./Promo";
import { C, GRADIENT, body, heading } from "./theme";

const T = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Each scene = 6f lead-in + its voice-over line + the transition overlap + a breath
export const DEMO_SCENES = [196, 223, 254, 266, 196, 177, 244, 225, 191, 191, 191, 227];
export const DEMO_DURATION = DEMO_SCENES.reduce((a, b) => a + b, 0) - T * (DEMO_SCENES.length - 1);
const VO_FRAMES = [161, 188, 219, 231, 161, 142, 209, 190, 156, 156, 156, 192];

function Heading({ n, step, title }: { n: number; step: string; title: string }) {
  return (
    <div style={{ position: "absolute", left: 130, top: 56, display: "grid", gap: 14 }}>
      <StepTag n={n} label={step} />
      <Rise text={title} size={64} delay={6} />
    </div>
  );
}

/* 1 — Intro: logo, then the four things the tour covers pop in around it */
const TOUR_CHIPS = [
  { label: "Plan", tone: PASTEL.sky, x: 330, y: 250, at: 44 },
  { label: "Schedule", tone: PASTEL.butter, x: 1420, y: 230, at: 56 },
  { label: "Remind", tone: PASTEL.blush, x: 380, y: 760, at: 68 },
  { label: "Encourage", tone: PASTEL.mint, x: 1130, y: 770, at: 80 },
];
function Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      {TOUR_CHIPS.map((c) => (
        <div key={c.label} style={{ position: "absolute", left: c.x, top: c.y + Math.sin((frame - c.at) / 12) * 6 }}>
          <Pop at={c.at}>
            <span style={{ display: "inline-block", padding: "16px 30px", borderRadius: 999, background: c.tone, border: "4px solid white", fontFamily: body, fontWeight: 700, fontSize: 34, color: C.ink, boxShadow: "0 20px 40px -18px rgba(36,91,255,0.45)" }}>{c.label}</span>
          </Pop>
        </div>
      ))}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <Logo size={150} />
          <span style={{ fontFamily: heading, fontWeight: 700, fontSize: 170, color: C.ink, letterSpacing: -5, opacity: word, transform: `translateX(${(1 - word) * 40}px)` }}>Declare</span>
        </div>
        <Sub text="Product tour: how your team runs Sunday" delay={18} size={44} />
      </AbsoluteFill>
      <Confetti at={10} x={960} y={420} count={60} spread={0.8} />
      <div style={{ position: "absolute", right: 120, bottom: 40 }}>
        <Mascot src="full/girl_tablet_wave" height={330} delay={22} />
      </div>
    </AbsoluteFill>
  );
}

/* 2 — Dashboard (real screenshot, camera zooms to what needs attention) */
function Dashboard() {
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={1} step="Dashboard" title="See what Sunday needs at a glance" />
      <div style={{ position: "absolute", left: 310, top: 262 }}>
        <BrowserShot
          src="marketing/dashboard.png"
          width={1300}
          url="declare-cyan.vercel.app/dashboard"
          keys={[
            { at: 0, scale: 1, x: 0.5, y: 0.45 },
            { at: 50, scale: 1, x: 0.5, y: 0.45 },
            { at: 86, scale: 1.65, x: 0.78, y: 0.4 },
            { at: 150, scale: 1.65, x: 0.78, y: 0.4 },
            { at: 182, scale: 1.55, x: 0.45, y: 0.86 },
            { at: 223, scale: 1.55, x: 0.45, y: 0.86 },
          ]}
        >
          {(toScreen) => {
            const a = toScreen(0.6, 0.205);
            const b = toScreen(0.34, 0.83);
            return (
              <>
                <Callout text="Every open role, before Sunday" at={92} left={a.left} top={a.top} side="left" />
                <Callout text="Who still needs to reply" at={188} left={b.left} top={b.top} side="right" />
              </>
            );
          }}
        </BrowserShot>
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 30 }}>
        <Mascot src="full/boy_thumbs_tablet" height={240} delay={20} />
      </div>
    </AbsoluteFill>
  );
}

/* 3 — Services list: upcoming tiles in blue with "Next up", past ones in grey */
const SERVICES = [
  { title: "Sunday Worship", mon: "OCT", day: "25", when: "Sun, Oct 25 · 9:00 AM", past: false, next: true },
  { title: "Youth Night", mon: "OCT", day: "30", when: "Fri, Oct 30 · 7:00 PM", past: false },
  { title: "Sunday Worship", mon: "NOV", day: "1", when: "Sun, Nov 1 · 9:00 AM", past: false },
  { title: "Sunday Worship", mon: "OCT", day: "18", when: "Sun, Oct 18 · 9:00 AM", past: true },
  { title: "Prayer Night", mon: "OCT", day: "14", when: "Wed, Oct 14 · 7:00 PM", past: true },
];
const LIST = { left: 330, top: 250, width: 1240 };
function tileTop(i: number) {
  // upcoming header 44, tiles 104 + 14 gap, past header after a 26 gap
  return i < 3 ? 44 + i * 118 : 44 + 3 * 118 + 26 + 44 + (i - 3) * 118;
}
function ServiceTile({ s, at, hover }: { s: (typeof SERVICES)[number]; at: number; hover: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 140 } });
  const dateBg = s.past ? "#eef2f7" : s.next ? C.primary : "#e3ebff";
  const dateFg = s.past ? C.muted : s.next ? "white" : C.primary;
  return (
    <div
      style={{
        height: 104,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 26px",
        borderRadius: 22,
        background: s.past ? "#f3f5f9" : "#f5f8ff",
        border: `${s.next ? 4 : 2}px solid ${s.past ? "#e6ebf2" : s.next ? "rgba(36,91,255,0.55)" : "rgba(36,91,255,0.22)"}`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 24}px) scale(${1 + hover * 0.015})`,
        boxShadow: hover > 0 ? `0 ${20 * hover}px ${40 * hover}px -16px rgba(36,91,255,0.45)` : "none",
        fontFamily: body,
      }}
    >
      <div style={{ width: 70, height: 70, borderRadius: 18, background: dateBg, color: dateFg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1.5 }}>{s.mon}</span>
        <span style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{s.day}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 600, color: s.past ? C.muted : C.ink }}>
          {s.title}
          {s.next ? <span style={{ padding: "4px 12px", borderRadius: 999, background: C.primary, color: "white", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>NEXT UP</span> : null}
        </span>
        <span style={{ fontSize: 20, color: C.muted }}>{s.when} · Main campus</span>
      </div>
    </div>
  );
}
function ServicesList() {
  const frame = useCurrentFrame();
  const hover = interpolate(frame, [104, 116], [0, 1], clamp) * (frame < 236 ? 1 : 0);
  const sectionHead = (label: string, dot: string, count: number) => (
    <div style={{ height: 44, display: "flex", alignItems: "center", gap: 12, fontFamily: body, fontSize: 22, fontWeight: 600, color: C.muted }}>
      <span style={{ width: 12, height: 12, borderRadius: "50%", background: dot }} /> {label} <span style={{ opacity: 0.6 }}>{count}</span>
    </div>
  );
  const nextTile = { x: LIST.left + 420, y: LIST.top + tileTop(0) + 52 };
  const olderBtn = { x: LIST.left + 150, y: LIST.top + tileTop(4) + 104 + 34 };
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={2} step="Services" title="Every service in one tidy list" />
      <div style={{ position: "absolute", ...LIST }}>
        <div style={{ position: "absolute", top: 0 }}>{sectionHead("Upcoming", C.primary, 3)}</div>
        <div style={{ position: "absolute", top: tileTop(3) - 44 }}>{sectionHead("Past", "#b6c0cf", 7)}</div>
        {SERVICES.map((s, i) => (
          <div key={s.day + s.title} style={{ position: "absolute", top: tileTop(i), width: LIST.width }}>
            <ServiceTile s={s} at={14 + i * 9} hover={i === 0 ? hover : 0} />
          </div>
        ))}
        <div style={{ position: "absolute", top: tileTop(4) + 104 + 16, fontFamily: body, fontSize: 22, fontWeight: 600, color: C.muted, padding: "10px 18px", borderRadius: 14, background: frame > 168 && frame < 200 ? "#e8edf5" : "transparent", opacity: interpolate(frame, [60, 70], [0, 1], clamp) }}>
          Show 5 older services
        </div>
      </div>
      <Callout text="The next service, highlighted" at={118} left={LIST.left + LIST.width - 10} top={LIST.top + tileTop(0) + 52} side="left" />
      <Callout text="Past services stay tidy" at={176} left={LIST.left + 330} top={olderBtn.y} side="right" />
      <Cursor
        path={[
          { at: 0, x: 1700, y: 1040 },
          { at: 104, x: nextTile.x, y: nextTile.y },
          { at: 150, x: nextTile.x, y: nextTile.y },
          { at: 172, x: olderBtn.x, y: olderBtn.y },
          { at: 214, x: olderBtn.x, y: olderBtn.y },
          { at: 236, x: nextTile.x, y: nextTile.y },
          { at: 240, x: nextTile.x, y: nextTile.y, click: true },
        ]}
      />
      <div style={{ position: "absolute", right: 40, bottom: 20 }}>
        <Mascot src="full/duo_laptop" height={200} delay={30} />
      </div>
    </AbsoluteFill>
  );
}

/* 4 — Service plan (real screenshot) */
function Plan() {
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={3} step="Service plan" title="Build the whole service flow" />
      <div style={{ position: "absolute", left: 310, top: 262 }}>
        <BrowserShot
          src="marketing/services.png"
          width={1300}
          url="declare-cyan.vercel.app/services"
          keys={[
            { at: 0, scale: 1.1, x: 0.55, y: 0.5 },
            { at: 40, scale: 1.1, x: 0.55, y: 0.5 },
            { at: 90, scale: 1.4, x: 0.5, y: 0.6 },
            { at: 150, scale: 1.4, x: 0.5, y: 0.6 },
            { at: 200, scale: 1.6, x: 0.45, y: 0.66 },
            { at: 266, scale: 1.6, x: 0.45, y: 0.66 },
          ]}
        >
          {(toScreen) => {
            const a = toScreen(0.42, 0.6);
            const b = toScreen(0.235, 0.715);
            return (
              <>
                <Callout text="Songs, sermon & segments in order" at={96} left={a.left} top={a.top} side="right" />
                <Callout text="Running times add up for you" at={160} left={b.left} top={b.top} side="right" />
              </>
            );
          }}
        </BrowserShot>
      </div>
      <div style={{ position: "absolute", right: 50, bottom: 30 }}>
        <Mascot src="full/girl_laptop" height={240} delay={20} />
      </div>
    </AbsoluteFill>
  );
}

/* 5 — Roles tab: add a person, then send every invite at once */
const PANEL = { left: 160, top: 236, width: 1600, height: 800 };
const ADD_CLICK = { x: 1130, y: 488 };
const PICK = { x: 1010, y: 556 };
const SEND = { x: 1580, y: 290 };
function Schedule() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const menu = frame >= 52 && frame < 84 ? spring({ frame: frame - 52, fps, config: { damping: 200 } }) : 0;
  const sent = frame >= 140;
  const toast = spring({ frame: frame - 152, fps, config: { damping: 14 } });
  const s = 0.85;
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <div style={{ position: "absolute", left: 130, top: 56, display: "grid", gap: 14 }}>
        <StepTag n={4} label="Roles" />
      </div>
      <div style={{ position: "absolute", left: 420, top: 70 }}>
        <Rise text="Pick who serves, then send every invite at once" size={56} />
      </div>
      <div style={{ position: "absolute", ...PANEL, background: "white", borderRadius: 32, boxShadow: "0 40px 90px -30px rgba(36,91,255,0.35)", border: `3px solid ${C.border}`, fontFamily: body }}>
        <div style={{ position: "absolute", left: 40, top: 30, fontFamily: heading, fontSize: 40, fontWeight: 700, color: C.ink }}>
          Sunday Worship <span style={{ fontFamily: body, fontSize: 22, fontWeight: 400, color: C.muted }}>· Sun, Oct 25 · 9:00 AM</span>
        </div>
        <div style={{ position: "absolute", right: 40, top: 24, width: 280, height: 60, borderRadius: 14, background: sent ? "#9db5ff" : C.primary, color: "white", fontWeight: 600, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transform: `scale(${frame >= 136 && frame < 146 ? 0.94 : 1})` }}>
          Send Invites ({sent ? 0 : 3})
        </div>
        <div style={{ position: "absolute", left: 40, top: 110, width: 300 }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: 2, color: C.muted, marginBottom: 12 }}>TEAMS</div>
          <div style={{ padding: "16px 20px", borderRadius: 14, background: "#e8eeff", border: "2px solid #c7d4ff", fontSize: 22, fontWeight: 600, color: C.primary }}>Media Team</div>
          <div style={{ padding: "16px 20px", fontSize: 22, fontWeight: 500, color: C.ink }}>Worship Team</div>
          <div style={{ padding: "16px 20px", fontSize: 22, fontWeight: 500, color: C.ink }}>Hospitality</div>
        </div>
        <div style={{ position: "absolute", left: 380, top: 110, width: 1180 }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: 2, color: C.muted, height: 40 }}>ROLES</div>
          <div style={{ display: "grid", gap: 18 }}>
            <RoleBox name="Main Cam CH 1" mascot="crew_tripod" scale={s} rows={[{ name: "Joshua Perez", status: "invited", appearAt: 84, statusAt: 142 }]} />
            <RoleBox name="Sound Engineer" mascot="crew_audio" scale={s} rows={[{ name: "Paolo Cruz", status: "invited", statusAt: 146 }]} />
            <RoleBox name="Livestream" mascot="crew_live" scale={s} rows={[{ name: "Ana Reyes", status: "invited", statusAt: 150 }]} />
          </div>
        </div>
      </div>
      {menu > 0 ? (
        <div style={{ position: "absolute", left: 900, top: 516, width: 460, padding: 12, borderRadius: 18, background: "white", boxShadow: "0 24px 60px rgba(15,23,42,0.25)", border: `2px solid ${C.border}`, opacity: menu, transform: `translateY(${(1 - menu) * -12}px)`, fontFamily: body, zIndex: 20 }}>
          {["Joshua Perez", "Mark Alberto", "Grace Lim"].map((name, i) => (
            <div key={name} style={{ padding: "12px 16px", borderRadius: 12, fontSize: 22, color: C.ink, background: i === 0 && frame >= 70 ? "#eef3ff" : "transparent" }}>
              {name}
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ position: "absolute", right: 90, bottom: 56, display: "flex", alignItems: "center", gap: 12, padding: "18px 26px", borderRadius: 18, background: C.ink, color: "white", fontFamily: body, fontWeight: 600, fontSize: 24, opacity: frame >= 152 ? 1 : 0, transform: `translateY(${(1 - toast) * 60}px)` }}>
        <Check size={24} color="#4ade80" /> Invites sent
      </div>
      <Cursor
        path={[
          { at: 0, x: 1500, y: 980 },
          { at: 46, x: ADD_CLICK.x, y: ADD_CLICK.y, click: true },
          { at: 72, x: PICK.x, y: PICK.y },
          { at: 80, x: PICK.x, y: PICK.y, click: true },
          { at: 132, x: SEND.x, y: SEND.y },
          { at: 140, x: SEND.x, y: SEND.y, click: true },
          { at: 196, x: SEND.x + 40, y: SEND.y + 140 },
        ]}
      />
    </AbsoluteFill>
  );
}

/* 6 — Blockout conflict: the picker flags Grace as away, Mia gets the role instead */
const PICKER = [
  { name: "Grace Lim", away: true },
  { name: "Mia Tan", away: false },
  { name: "Ken Dizon", away: false },
];
function Conflict() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = frame >= 30 && frame < 104 ? spring({ frame: frame - 30, fps, config: { damping: 15, stiffness: 180 } }) : 0;
  const warn = spring({ frame: frame - 62, fps, config: { damping: 12, stiffness: 160 } });
  const BOX = { left: 360, top: 300, width: 1200 };
  const ADD = { x: BOX.left + 600, y: BOX.top + 172 };
  const row = (i: number) => ({ x: BOX.left + 520, y: BOX.top + 212 + 26 + 40 + i * 74 });
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={5} step="Blockout dates" title="Conflicts flagged before you invite" />
      <div style={{ position: "absolute", ...BOX }}>
        <RoleBox name="Slides & Lyrics" mascot="laptop" scale={1.15} enterAt={6} rows={[{ name: "Mia Tan", status: "invited", appearAt: 110 }]} />
      </div>
      {open > 0 ? (
        <div style={{ position: "absolute", left: BOX.left + 330, top: BOX.top + 212, width: 600, padding: 14, borderRadius: 22, background: "white", border: `2px solid ${C.border}`, boxShadow: "0 30px 70px rgba(15,23,42,0.25)", transform: `scale(${open})`, transformOrigin: "50% 0", fontFamily: body, zIndex: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: 2, color: C.muted, padding: "6px 12px 12px" }}>CHOOSE A VOLUNTEER</div>
          {PICKER.map((p, i) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14, height: 74, padding: "0 16px", borderRadius: 16, background: !p.away && i === 1 && frame >= 92 ? "#eef3ff" : p.away && frame >= 56 && frame < 90 ? "#fff7e6" : "transparent", opacity: p.away ? 0.75 : 1 }}>
              <span style={{ width: 46, height: 46, borderRadius: "50%", background: p.away ? "#fef3c7" : C.slateBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: p.away ? C.amber : C.muted }}>
                {p.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <span style={{ fontSize: 26, fontWeight: 600, color: C.ink, textDecoration: p.away ? "line-through" : "none" }}>{p.name}</span>
              <span style={{ marginLeft: "auto" }}>
                {p.away ? <Chip status="unavailable" size={19} /> : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: C.greenBg, color: C.green, fontWeight: 600, fontSize: 19 }}>
                    <Check size={17} /> Available
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {/* Warning bubble explaining why Grace is unavailable */}
      <div style={{ position: "absolute", left: BOX.left + 950, top: row(0).y - 46, opacity: frame < 104 ? Math.min(1, warn * 1.4) : interpolate(frame, [104, 112], [1, 0], clamp), transform: `scale(${interpolate(warn, [0, 1], [0.7, 1])})`, transformOrigin: "0 50%", zIndex: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderRadius: 20, background: C.ink, color: "white", fontFamily: body, boxShadow: "0 20px 40px rgba(15,23,42,0.3)" }}>
          <Mascot src="full/boy_running" height={70} delay={62} float={false} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Grace blocked out this date</div>
            <div style={{ fontSize: 18, opacity: 0.75 }}>Away Sunday, Oct 25</div>
          </div>
        </div>
      </div>
      <Confetti at={112} x={BOX.left + 900} y={BOX.top + 200} count={35} spread={0.6} />
      <Cursor
        path={[
          { at: 0, x: 1650, y: 1020 },
          { at: 24, x: ADD.x, y: ADD.y },
          { at: 30, x: ADD.x, y: ADD.y, click: true },
          { at: 56, x: row(0).x, y: row(0).y },
          { at: 84, x: row(0).x, y: row(0).y },
          { at: 96, x: row(1).x, y: row(1).y },
          { at: 102, x: row(1).x, y: row(1).y, click: true },
          { at: 170, x: row(1).x + 200, y: row(1).y + 120 },
        ]}
      />
    </AbsoluteFill>
  );
}

/* 7 — Volunteers respond from their phone; the lineup updates */
function Respond() {
  const frame = useCurrentFrame();
  const fly = interpolate(frame, [10, 32], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={6} step="Volunteers respond" title="One tap to accept, from any phone" />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 110, paddingTop: 200 }}>
        <div style={{ transform: "scale(0.92)" }}>
          <RespondScreen tapAt={140} notifAt={34} />
        </div>
        <div style={{ width: 760, display: "grid", gap: 22 }}>
          <Sub text="Back on your screen, the lineup updates the moment they answer:" size={30} style={{ maxWidth: 700 }} />
          <RoleBox name="Main Cam CH 1" mascot="crew_tripod" addRow={false} rows={[{ name: "Joshua Perez", status: "accepted", statusAt: 146 }]} />
        </div>
      </AbsoluteFill>
      {/* The invite email flies to the phone */}
      <div style={{ position: "absolute", left: 1500 + (700 - 1500) * fly - 48, top: 980 + (420 - 980) * fly - Math.sin(fly * Math.PI) * 200 - 48, width: 96, height: 96, borderRadius: 28, background: PASTEL.sky, border: "4px solid white", boxShadow: "0 20px 40px rgba(15,23,42,0.25)", display: "flex", alignItems: "center", justifyContent: "center", opacity: frame < 33 ? interpolate(frame, [0, 8], [0, 1], clamp) : 0, transform: `scale(${1 - fly * 0.5})` }}>
        <MailIcon size={46} color={C.primary} />
      </div>
      <Confetti at={146} x={1450} y={700} count={45} spread={0.7} />
    </AbsoluteFill>
  );
}

/* 8 — Reminders (shared timeline with the promo, under a tour heading) */
function DemoReminders() {
  return (
    <Reminders
      header={<Heading n={7} step="Reminders" title="Automatic nudges before Sunday" />}
    />
  );
}

/* 9 — The volunteer's side: My Schedule and blockout dates */
const MINE = [
  { role: "Main Cam CH 1", when: "Sun, Oct 25 · 9:00 AM", status: "accepted" as const },
  { role: "Livestream", when: "Sun, Nov 1 · 9:00 AM", status: "invited" as const },
  { role: "Main Cam CH 1", when: "Sun, Nov 8 · 9:00 AM", status: "accepted" as const },
];
function MySchedule() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const added = spring({ frame: frame - 112, fps, config: { damping: 13, stiffness: 150 } });
  const screen = (title: string, children: ReactNode) => (
    <div style={{ position: "absolute", inset: 0, padding: "70px 20px 0", fontFamily: body }}>
      <div style={{ fontFamily: heading, fontSize: 34, fontWeight: 700, color: C.ink, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={8} step="For volunteers" title="Everything they serve, in one place" />
      <div style={{ position: "absolute", left: 420, top: 230, transform: "scale(0.95)", transformOrigin: "0 0" }}>
        <Phone>
          {screen(
            "My Schedule",
            <div style={{ display: "grid", gap: 12 }}>
              {MINE.map((m, i) => (
                <Pop key={i} at={18 + i * 10}>
                  <div style={{ padding: "16px 18px", borderRadius: 20, background: "white", border: `2px solid ${C.border}` }}>
                    <div style={{ fontSize: 21, fontWeight: 700, color: C.ink }}>{m.role}</div>
                    <div style={{ fontSize: 16, color: C.muted, margin: "2px 0 10px" }}>{m.when}</div>
                    <Chip status={m.status} size={16} />
                  </div>
                </Pop>
              ))}
            </div>
          )}
        </Phone>
      </div>
      <div style={{ position: "absolute", left: 1100, top: 230, transform: "scale(0.95)", transformOrigin: "0 0" }}>
        <Phone>
          {screen(
            "Blockout Dates",
            <div style={{ display: "grid", gap: 12 }}>
              <Pop at={40}>
                <div style={{ padding: "16px 18px", borderRadius: 20, background: "white", border: `2px solid ${C.border}` }}>
                  <div style={{ fontSize: 21, fontWeight: 700, color: C.ink }}>Oct 11</div>
                  <div style={{ fontSize: 16, color: C.muted }}>Out of town</div>
                </div>
              </Pop>
              <Pop at={56}>
                <div style={{ padding: "16px", borderRadius: 18, border: `3px dashed ${C.primary}`, textAlign: "center", fontSize: 19, fontWeight: 700, color: C.primary, transform: `scale(${frame >= 96 && frame < 104 ? 0.95 : 1})` }}>+ Add a blockout</div>
              </Pop>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 20, background: PASTEL.blush, border: "3px solid white", opacity: Math.min(1, added * 1.3), transform: `translateY(${(1 - added) * 30}px) scale(${interpolate(added, [0, 1], [0.85, 1])})` }}>
                <Mascot src="full/boy_running" height={64} delay={112} float={false} />
                <div>
                  <div style={{ fontSize: 21, fontWeight: 700, color: C.ink }}>Nov 15 – 16</div>
                  <div style={{ fontSize: 16, color: C.muted }}>Family trip</div>
                </div>
              </div>
            </div>
          )}
        </Phone>
      </div>
      {/* Tap indicator on "+ Add a blockout" */}
      {frame >= 92 && frame < 112 ? (
        <span style={{ position: "absolute", left: 1290 - 34, top: 496 - 34, width: 68, height: 68, borderRadius: "50%", background: "rgba(36,91,255,0.3)", transform: `scale(${interpolate(frame, [92, 112], [0.6, 1.6])})`, opacity: interpolate(frame, [92, 112], [0.9, 0]) }} />
      ) : null}
    </AbsoluteFill>
  );
}

/* 10 — People (real screenshot) */
function People() {
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={9} step="Your team" title="One roster for every volunteer" />
      <div style={{ position: "absolute", left: 310, top: 262 }}>
        <BrowserShot
          src="marketing/people.png"
          width={1300}
          url="declare-cyan.vercel.app/people"
          keys={[
            { at: 0, scale: 1.1, x: 0.5, y: 0.42 },
            { at: 40, scale: 1.1, x: 0.5, y: 0.42 },
            { at: 80, scale: 1.45, x: 0.66, y: 0.4 },
            { at: 191, scale: 1.5, x: 0.68, y: 0.4 },
          ]}
        >
          {(toScreen) => {
            const a = toScreen(0.72, 0.245);
            const b = toScreen(0.885, 0.12);
            return (
              <>
                <Callout text="The roles each person serves in" at={86} left={a.left} top={a.top} side="left" />
                <Callout text="Invite anyone by email" at={124} left={b.left} top={b.top} side="left" />
              </>
            );
          }}
        </BrowserShot>
      </div>
      <div style={{ position: "absolute", right: 50, bottom: 30 }}>
        <Mascot src="full/duo_thumbs_peace" height={230} delay={20} />
      </div>
    </AbsoluteFill>
  );
}

/* 11 — Team chat & weekly devotional */
const CHAT = [
  { who: "Pastor Dan", text: "Call time is 7:30 AM this Sunday.", at: 30, mine: false },
  { who: "Joshua", text: "On it! Cameras are charged.", at: 62, mine: true },
  { who: "Ana", text: "Stream test at 8:00 sharp.", at: 94, mine: false },
];
function Care() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Backdrop variant="pastel" />
      <Heading n={10} step="Encourage your team" title="Team chat & weekly devotionals" />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 60, paddingTop: 210, fontFamily: body }}>
        <div style={{ position: "relative", width: 720, opacity: card, transform: `translateY(${(1 - card) * 30}px)` }}>
          <div style={{ position: "absolute", right: 10, top: -150, zIndex: 2 }}>
            <Mascot src="full/duo_hug" height={200} delay={16} />
          </div>
          <div style={{ borderRadius: 30, padding: "44px 40px", background: GRADIENT, color: "white", boxShadow: "0 30px 60px -20px rgba(36,91,255,0.5)" }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, opacity: 0.85 }}>ROMANS 12:6-8</div>
            <div style={{ fontFamily: heading, fontSize: 46, fontWeight: 700, marginTop: 8 }}>Serve According to Your Gift</div>
            <div style={{ marginTop: 20, borderLeft: "4px solid rgba(255,255,255,0.45)", paddingLeft: 18, fontSize: 24, fontStyle: "italic", lineHeight: 1.45 }}>
              Having gifts differing according to the grace that was given to us, let us use them.
            </div>
            <div style={{ marginTop: 22, fontSize: 19, fontWeight: 600, opacity: 0.85 }}>Sent to the whole team every Sunday at 6:00 AM</div>
          </div>
        </div>
        <div style={{ width: 640, padding: 28, borderRadius: 30, background: "white", border: `3px solid ${C.border}`, boxShadow: "0 30px 60px -20px rgba(36,91,255,0.3)", opacity: card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <Mascot src="full/boy_headset_walkie" height={84} delay={20} float={false} />
            <div style={{ fontFamily: heading, fontSize: 30, fontWeight: 700, color: C.ink }}>Media Team chat</div>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {CHAT.map((m) => {
              if (frame < m.at) return null;
              const typing = frame < m.at + 14;
              const s = spring({ frame: frame - m.at, fps, config: { damping: 13, stiffness: 160 } });
              return (
                <div key={m.text} style={{ justifySelf: m.mine ? "end" : "start", maxWidth: 470, transform: `scale(${s})`, transformOrigin: m.mine ? "right bottom" : "left bottom" }}>
                  <div style={{ fontSize: 17, color: C.muted, marginBottom: 4, textAlign: m.mine ? "right" : "left" }}>{m.who}</div>
                  <div style={{ padding: "14px 20px", borderRadius: 20, fontSize: 23, background: m.mine ? C.primary : C.slateBg, color: m.mine ? "white" : C.ink }}>
                    {typing ? (
                      <span style={{ display: "inline-flex", gap: 8 }}>
                        {[0, 1, 2].map((d) => (
                          <span key={d} style={{ width: 11, height: 11, borderRadius: "50%", background: m.mine ? "white" : C.muted, opacity: 0.4 + 0.6 * Math.max(0, Math.sin((frame - m.at) / 3 - d)) }} />
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
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Outro() {
  return <CallToAction headline="Start scheduling your team today." badges={["Works in any browser", "Android app", "Free to start"]} />;
}

const SCENES = [Intro, Dashboard, ServicesList, Plan, Schedule, Conflict, Respond, DemoReminders, MySchedule, People, Care, Outro];

// Sound effects per scene: [effect, scene-relative frame, volume]
type Hit = [SfxName, number, number];
const hits = (name: SfxName, ats: number[], volume: number): Hit[] => ats.map((at) => [name, at, volume]);
const SCENE_SFX: Hit[][] = [
  [["confetti", 10, 0.4], ["pop", 22, 0.25], ...hits("pop", TOUR_CHIPS.map((c) => c.at), 0.32)],
  [["whoosh", 0, 0.18], ["pop", 92, 0.3], ["pop", 188, 0.3]],
  [["whoosh", 0, 0.18], ...hits("pop", SERVICES.map((_, i) => 14 + i * 9), 0.18), ["pop", 118, 0.3], ["pop", 176, 0.3], ["click", 240, 0.5]],
  [["whoosh", 0, 0.18], ["pop", 96, 0.3], ["pop", 160, 0.3]],
  [["whoosh", 0, 0.18], ["click", 46, 0.5], ["click", 80, 0.5], ["pop", 84, 0.22], ["click", 140, 0.5], ["success", 152, 0.4]],
  [["whoosh", 0, 0.18], ["click", 30, 0.5], ["pop", 62, 0.3], ["click", 102, 0.5], ["success", 110, 0.4], ["confetti", 112, 0.28]],
  [["whoosh", 0, 0.18], ["whoosh", 10, 0.35], ["ding", 34, 0.5], ["click", 140, 0.5], ["success", 146, 0.45], ["confetti", 146, 0.3]],
  [["whoosh", 0, 0.18], ["bell", 78, 0.45], ["bell", 128, 0.45], ["success", 176, 0.45]],
  [["whoosh", 0, 0.18], ...hits("pop", [18, 28, 38], 0.25), ["click", 96, 0.5], ["pop", 112, 0.35]],
  [["whoosh", 0, 0.18], ["pop", 86, 0.3], ["pop", 124, 0.3]],
  [["whoosh", 0, 0.18], ...hits("bloop", CHAT.map((m) => m.at + 14), 0.4)],
  [["pop", 30, 0.35], ["confetti", 34, 0.35], ...hits("pop", [48, 56, 64], 0.25)],
];

const musicVolume = duckedMusic(DEMO_SCENES, VO_FRAMES, T);

export function Demo() {
  const t = linearTiming({ durationInFrames: T });
  const transitionFor = (i: number, key: string) =>
    i === 1 || i === 11 ? (
      <TransitionSeries.Transition key={key} presentation={fade()} timing={t} />
    ) : (
      <TransitionSeries.Transition key={key} presentation={slide({ direction: "from-right" })} timing={t} />
    );
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {SCENES.flatMap((Scene, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={DEMO_SCENES[i]}>
              <Scene />
              <Voice name={`demo-${i + 1}`} />
              {SCENE_SFX[i].map(([name, at, volume], k) => (
                <Sfx key={k} name={name} at={at} volume={volume} />
              ))}
            </TransitionSeries.Sequence>,
          ];
          if (i < SCENES.length - 1) items.push(transitionFor(i + 1, `t${i}`));
          return items;
        })}
      </TransitionSeries>
      <Html5Audio src={staticFile("videos/music/demo-bed.mp3")} volume={musicVolume} />
    </AbsoluteFill>
  );
}
