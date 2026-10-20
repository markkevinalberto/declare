import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Backdrop, BrowserShot, Callout, Check, Cursor, Logo, Mascot, RoleBox, Rise, StepTag, Sub, Voice } from "./components";
import { CallToAction, RespondScreen } from "./Promo";
import { C, GRADIENT, body, heading } from "./theme";

const T = 15;
// Each scene is long enough for its voice-over line (audio + 6f lead-in + transition overlap)
export const DEMO_SCENES = [113, 210, 180, 240, 180, 160, 150, 135];
export const DEMO_DURATION = DEMO_SCENES.reduce((a, b) => a + b, 0) - T * (DEMO_SCENES.length - 1);

function Heading({ n, step, title }: { n: number; step: string; title: string }) {
  return (
    <div style={{ position: "absolute", left: 130, top: 56, display: "grid", gap: 14 }}>
      <StepTag n={n} label={step} />
      <Rise text={title} size={64} delay={6} />
    </div>
  );
}

function Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <Logo size={150} />
          <span style={{ fontFamily: heading, fontWeight: 700, fontSize: 170, color: C.ink, letterSpacing: -5, opacity: word }}>Declare</span>
        </div>
        <Sub text="Product tour — how your team runs Sunday" delay={18} size={44} />
      </AbsoluteFill>
      <div style={{ position: "absolute", right: 140, bottom: 70 }}>
        <Mascot src="full/girl_tablet_wave" height={360} delay={22} />
      </div>
    </AbsoluteFill>
  );
}

function Dashboard() {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Heading n={1} step="Dashboard" title="See what Sunday needs at a glance" />
      <div style={{ position: "absolute", left: 310, top: 262 }}>
        <BrowserShot
          src="marketing/dashboard.png"
          width={1300}
          url="declare-cyan.vercel.app/dashboard"
          keys={[
            { at: 0, scale: 1, x: 0.5, y: 0.45 },
            { at: 55, scale: 1, x: 0.5, y: 0.45 },
            { at: 90, scale: 1.65, x: 0.78, y: 0.4 },
            { at: 140, scale: 1.65, x: 0.78, y: 0.4 },
            { at: 170, scale: 1.55, x: 0.45, y: 0.86 },
            { at: 210, scale: 1.55, x: 0.45, y: 0.86 },
          ]}
        >
          {(toScreen) => (
            <>
              {(() => {
                const p = toScreen(0.6, 0.205);
                return <Callout text="Every open role, before Sunday" at={96} left={p.left} top={p.top} side="left" />;
              })()}
              {(() => {
                const p = toScreen(0.34, 0.83);
                return <Callout text="Who still needs to reply" at={176} left={p.left} top={p.top} side="right" />;
              })()}
            </>
          )}
        </BrowserShot>
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 30 }}>
        <Mascot src="full/boy_thumbs_tablet" height={240} delay={20} />
      </div>
    </AbsoluteFill>
  );
}

function Plan() {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Heading n={2} step="Service plan" title="Build the whole service flow" />
      <div style={{ position: "absolute", left: 310, top: 262 }}>
        <BrowserShot
          src="marketing/services.png"
          width={1300}
          url="declare-cyan.vercel.app/services"
          keys={[
            { at: 0, scale: 1.25, x: 0.55, y: 0.62 },
            { at: 60, scale: 1.25, x: 0.55, y: 0.62 },
            { at: 100, scale: 1.5, x: 0.5, y: 0.62 },
            { at: 180, scale: 1.5, x: 0.5, y: 0.62 },
          ]}
        >
          {(toScreen) => (
            <>
              {(() => {
                const p = toScreen(0.42, 0.6);
                return <Callout text="Songs, sermon & segments in order" at={70} left={p.left} top={p.top} side="right" />;
              })()}
              {(() => {
                const p = toScreen(0.235, 0.715);
                return <Callout text="Running times add up for you" at={110} left={p.left} top={p.top} side="right" />;
              })()}
            </>
          )}
        </BrowserShot>
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 30 }}>
        <Mascot src="full/duo_laptop" height={220} delay={20} />
      </div>
    </AbsoluteFill>
  );
}

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
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 56, display: "grid", gap: 14 }}>
        <StepTag n={3} label="Schedule" />
      </div>
      <div style={{ position: "absolute", left: 470, top: 70 }}>
        <Rise text="Assign people, then send every invite at once" size={56} />
      </div>
      <div style={{ position: "absolute", ...PANEL, background: "white", borderRadius: 26, boxShadow: "0 40px 90px rgba(15,23,42,0.18)", border: "2px solid rgba(15,23,42,0.06)", fontFamily: body }}>
        <div style={{ position: "absolute", left: 40, top: 30, fontFamily: heading, fontSize: 40, fontWeight: 700, color: C.ink }}>
          Sunday Worship <span style={{ fontFamily: body, fontSize: 22, fontWeight: 400, color: C.muted }}>· Sun, Oct 25 · 9:00 AM</span>
        </div>
        <div style={{ position: "absolute", right: 40, top: 24, width: 280, height: 60, borderRadius: 14, background: sent ? "#9db5ff" : C.primary, color: "white", fontWeight: 600, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          Send Invites ({sent ? 0 : 3})
        </div>
        <div style={{ position: "absolute", left: 40, top: 110, width: 300 }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: 2, color: C.muted, marginBottom: 12 }}>TEAMS</div>
          <div style={{ padding: "16px 20px", borderRadius: 14, background: "#e8eeff", border: `2px solid #c7d4ff`, fontSize: 22, fontWeight: 600, color: C.primary }}>Media Team</div>
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
          { at: 240, x: SEND.x + 40, y: SEND.y + 140 },
        ]}
      />
    </AbsoluteFill>
  );
}

function Respond() {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Heading n={4} step="Volunteers respond" title="One tap to accept, from any phone" />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 110, paddingTop: 200 }}>
        <div style={{ transform: "scale(0.92)" }}>
          <RespondScreen tapAt={118} />
        </div>
        <div style={{ width: 760, display: "grid", gap: 22 }}>
          <Sub text="Back on your screen, the lineup updates the moment they answer:" size={30} style={{ maxWidth: 700 }} />
          <RoleBox name="Main Cam CH 1" mascot="crew_tripod" addRow={false} rows={[{ name: "Joshua Perez", status: "accepted", statusAt: 124 }]} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function People() {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Heading n={5} step="Your team" title="One roster for every volunteer" />
      <div style={{ position: "absolute", left: 310, top: 262 }}>
        <BrowserShot
          src="marketing/people.png"
          width={1300}
          url="declare-cyan.vercel.app/people"
          keys={[
            { at: 0, scale: 1.1, x: 0.5, y: 0.42 },
            { at: 40, scale: 1.1, x: 0.5, y: 0.42 },
            { at: 80, scale: 1.45, x: 0.66, y: 0.4 },
            { at: 150, scale: 1.45, x: 0.66, y: 0.4 },
          ]}
        >
          {(toScreen) => (
            <>
              {(() => {
                const p = toScreen(0.72, 0.245);
                return <Callout text="The roles each person serves in" at={86} left={p.left} top={p.top} side="left" />;
              })()}
              {(() => {
                const p = toScreen(0.885, 0.12);
                return <Callout text="Invite anyone by email" at={112} left={p.left} top={p.top} side="left" />;
              })()}
            </>
          )}
        </BrowserShot>
      </div>
      <div style={{ position: "absolute", right: 50, bottom: 30 }}>
        <Mascot src="full/duo_thumbs_peace" height={230} delay={20} />
      </div>
    </AbsoluteFill>
  );
}

const CHAT = [
  { who: "Pastor Dan", text: "Call time is 7:30 AM this Sunday.", at: 30, mine: false },
  { who: "Joshua", text: "On it! Cameras are charged.", at: 55, mine: true },
  { who: "Ana", text: "Stream test at 8:00 sharp.", at: 80, mine: false },
];

function Care() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      <Heading n={6} step="Encourage your team" title="Weekly devotionals & team chat" />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 60, paddingTop: 210, fontFamily: body }}>
        <div style={{ position: "relative", width: 720, opacity: card, transform: `translateY(${(1 - card) * 30}px)` }}>
          <div style={{ position: "absolute", right: 10, top: -150, zIndex: 2 }}>
            <Mascot src="full/duo_hug" height={200} delay={16} />
          </div>
          <div style={{ borderRadius: 26, padding: "44px 40px", background: GRADIENT, color: "#0f172a", boxShadow: "0 30px 60px rgba(36,91,255,0.25)" }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, opacity: 0.7 }}>ROMANS 12:6-8</div>
            <div style={{ fontFamily: heading, fontSize: 46, fontWeight: 700, marginTop: 8 }}>Serve According to Your Gift</div>
            <div style={{ marginTop: 20, borderLeft: "4px solid rgba(15,23,42,0.25)", paddingLeft: 18, fontSize: 24, fontStyle: "italic", lineHeight: 1.45 }}>
              Having gifts differing according to the grace that was given to us, let us use them.
            </div>
            <div style={{ marginTop: 22, fontSize: 19, fontWeight: 600, opacity: 0.75 }}>Sent to the whole team every Sunday at 6:00 AM</div>
          </div>
        </div>
        <div style={{ width: 640, padding: 28, borderRadius: 26, background: "white", border: `2px solid ${C.border}`, boxShadow: "0 30px 60px rgba(15,23,42,0.1)", opacity: card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <Mascot src="full/boy_headset_walkie" height={84} delay={20} float={false} />
            <div style={{ fontFamily: heading, fontSize: 30, fontWeight: 700, color: C.ink }}>Media Team chat</div>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {CHAT.map((m) => {
              const s = spring({ frame: frame - m.at, fps, config: { damping: 13, stiffness: 160 } });
              return (
                <div key={m.text} style={{ justifySelf: m.mine ? "end" : "start", maxWidth: 470, transform: `scale(${s})`, transformOrigin: m.mine ? "right bottom" : "left bottom", opacity: Math.min(1, s * 1.4) }}>
                  <div style={{ fontSize: 17, color: C.muted, marginBottom: 4, textAlign: m.mine ? "right" : "left" }}>{m.who}</div>
                  <div style={{ padding: "14px 20px", borderRadius: 20, fontSize: 23, background: m.mine ? C.primary : C.slateBg, color: m.mine ? "white" : C.ink }}>{m.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function Demo() {
  const [intro, dash, plan, schedule, respond, people, care, outro] = DEMO_SCENES;
  const t = linearTiming({ durationInFrames: T });
  const next = slide({ direction: "from-right" });
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={intro}><Intro /><Voice name="demo-1" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence durationInFrames={dash}><Dashboard /><Voice name="demo-2" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={next} timing={t} />
      <TransitionSeries.Sequence durationInFrames={plan}><Plan /><Voice name="demo-3" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={next} timing={t} />
      <TransitionSeries.Sequence durationInFrames={schedule}><Schedule /><Voice name="demo-4" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={next} timing={t} />
      <TransitionSeries.Sequence durationInFrames={respond}><Respond /><Voice name="demo-5" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={next} timing={t} />
      <TransitionSeries.Sequence durationInFrames={people}><People /><Voice name="demo-6" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={next} timing={t} />
      <TransitionSeries.Sequence durationInFrames={care}><Care /><Voice name="demo-7" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence durationInFrames={outro}>
        <CallToAction headline="Start scheduling your team today." />
        <Voice name="demo-8" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
