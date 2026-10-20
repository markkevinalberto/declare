import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Html5Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, GRADIENT, body, heading } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** ElevenLabs voice-over line (public/videos/vo/<name>.mp3), starting just after its scene begins. */
export function Voice({ name, delay = 6 }: { name: string; delay?: number }) {
  return (
    <Sequence from={delay} layout="none">
      <Html5Audio src={staticFile(`videos/vo/${name}.mp3`)} />
    </Sequence>
  );
}

/** Pastel set shared with the landing page (sky, butter, blush, mint, lilac, peach). */
export const PASTEL = { sky: "#dcebff", butter: "#fff2c6", blush: "#ffe0ea", mint: "#d6f5e7", lilac: "#e9e1ff", peach: "#ffe6d5", pop: "#ff5c93", sun: "#ffc21a" };

/**
 * Volume curve for a music bed under a TransitionSeries: ducks under each scene's
 * voice-over line (starting 6f into the scene), swells between lines, fades out at the end.
 */
export function duckedMusic(scenes: number[], voFrames: number[], transition: number, loud = 0.32, duck = 0.13) {
  const starts = scenes.map((_, i) => scenes.slice(0, i).reduce((a, b) => a + b, 0) - transition * i);
  const total = scenes.reduce((a, b) => a + b, 0) - transition * (scenes.length - 1);
  return (f: number) => {
    let v = loud;
    starts.forEach((start, i) => {
      const a = start + 6;
      const b = a + voFrames[i];
      v = Math.min(v, interpolate(f, [a - 8, a, b, b + 10], [loud, duck, duck, loud], clamp));
    });
    return v * interpolate(f, [total - 45, total], [1, 0], clamp);
  };
}

export type SfxName = "pop" | "whoosh" | "click" | "ding" | "bell" | "success" | "confetti" | "bloop";

/** One-shot sound effect (public/videos/sfx/<name>.mp3) starting at frame `at`. */
export function Sfx({ name, at, volume = 0.4 }: { name: SfxName; at: number; volume?: number }) {
  return (
    <Sequence from={Math.max(0, at)} layout="none">
      <Html5Audio src={staticFile(`videos/sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
}

/** Soft brand backdrop with slowly drifting colour blobs. */
export function Backdrop({ variant = "light" }: { variant?: "light" | "dark" | "brand" | "pastel" }) {
  const frame = useCurrentFrame();
  const drift = (period: number, amp = 50) => Math.sin(frame / period) * amp;
  if (variant === "pastel") {
    const blob = (color: string, size: number, left: number, top: number, period: number) => (
      <div
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          left: left + drift(period, 60),
          top: top + drift(period * 1.3, 45),
          background: `radial-gradient(circle, ${color}, transparent 66%)`,
        }}
      />
    );
    return (
      <AbsoluteFill style={{ background: "#f7f9ff", overflow: "hidden" }}>
        {blob(PASTEL.sky, 1200, 1050, -520, 47)}
        {blob(PASTEL.blush, 1000, -420, 120, 53)}
        {blob(PASTEL.butter, 950, 560, 520, 41)}
        {blob(PASTEL.mint, 700, 1300, 520, 59)}
      </AbsoluteFill>
    );
  }
  const base =
    variant === "dark"
      ? `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 100%)`
      : variant === "brand"
        ? GRADIENT
        : `linear-gradient(160deg, #f6f9fd 0%, ${C.bg} 100%)`;
  const blobA = variant === "brand" ? "rgba(255,255,255,0.22)" : "rgba(36,91,255,0.20)";
  const blobB = variant === "brand" ? "rgba(255,255,255,0.16)" : "rgba(48,213,255,0.22)";
  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          left: -300 + drift(45),
          top: -450 + drift(60, 40),
          background: `radial-gradient(circle, ${blobA}, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          right: -280 + drift(52, 40),
          bottom: -420 + drift(38),
          background: `radial-gradient(circle, ${blobB}, transparent 62%)`,
        }}
      />
    </AbsoluteFill>
  );
}

/** Headline whose words rise in one after another. */
export function Rise({
  text,
  delay = 0,
  size = 96,
  color = C.ink,
  gradient = false,
  weight = 700,
  style,
}: {
  text: string;
  delay?: number;
  size?: number;
  color?: string;
  gradient?: boolean;
  weight?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ fontFamily: heading, fontSize: size, fontWeight: weight, lineHeight: 1.05, letterSpacing: -1.5, ...style }}>
      {text.split(" ").map((word, i) => {
        const s = spring({ frame: frame - delay - i * 4, fps, config: { damping: 200 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              opacity: s,
              transform: `translateY(${(1 - s) * 40}px)`,
              ...(gradient
                ? { backgroundImage: GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
                : { color }),
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

/** Supporting line that fades/slides in. */
export function Sub({ text, delay = 0, size = 38, color = C.muted, style }: { text: string; delay?: number; size?: number; color?: string; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div style={{ fontFamily: body, fontSize: size, color, lineHeight: 1.35, opacity: s, transform: `translateY(${(1 - s) * 20}px)`, ...style }}>
      {text}
    </div>
  );
}

/** Chibi mascot sticker that pops in and gently floats. */
export function Mascot({
  src,
  height,
  delay = 0,
  float = true,
  tilt = 0,
  style,
}: {
  src: string;
  height: number;
  delay?: number;
  float?: boolean;
  tilt?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 140 } });
  const y = float ? Math.sin((frame - delay) / 14) * 8 : 0;
  return (
    <Img
      src={staticFile(`mascot/${src}.png`)}
      style={{
        height,
        width: "auto",
        transform: `translateY(${y}px) scale(${pop}) rotate(${(1 - pop) * -14 + tilt}deg)`,
        filter: "drop-shadow(0 18px 26px rgba(15,23,42,0.28))",
        ...style,
      }}
    />
  );
}

/** The Declare speech-bubble "D" mark on its gradient tile. */
export function Logo({ size = 120, delay = 0 }: { size?: number; delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 140 } });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: GRADIENT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 24px 60px rgba(36,91,255,0.35)",
        transform: `scale(${s}) rotate(${(1 - s) * -20}deg)`,
      }}
    >
      <svg viewBox="20 20 265 300" width={size * 0.56} height={size * 0.56} fill="white">
        <path fillRule="evenodd" d="M 40,40 H 125 C 215,40 265,100 265,150 C 265,200 215,260 125,260 H 85 L 40,300 Z M 120,95 L 210,150 L 120,205 Z" />
      </svg>
    </div>
  );
}

export type Status = "accepted" | "invited" | "declined" | "draft" | "unavailable";
const CHIPS: Record<Status, { label: string; bg: string; fg: string }> = {
  accepted: { label: "Confirmed", bg: C.greenBg, fg: C.green },
  invited: { label: "Invited", bg: C.amberBg, fg: C.amber },
  declined: { label: "Declined", bg: C.redBg, fg: C.red },
  draft: { label: "Not invited", bg: C.slateBg, fg: C.muted },
  unavailable: { label: "Unavailable", bg: C.amberBg, fg: C.amber },
};

export function Check({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Status pill; `popAt` makes it bounce in at that frame (e.g. when it flips). */
export function Chip({ status, size = 20, popAt }: { status: Status; size?: number; popAt?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = popAt === undefined ? 1 : spring({ frame: frame - popAt, fps, config: { damping: 11, stiffness: 180 } });
  const chip = CHIPS[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: `${size * 0.3}px ${size * 0.7}px`,
        background: chip.bg,
        color: chip.fg,
        fontFamily: body,
        fontWeight: 600,
        fontSize: size,
        transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})`,
        whiteSpace: "nowrap",
      }}
    >
      {status === "accepted" ? <Check size={size * 0.9} /> : null}
      {chip.label}
    </span>
  );
}

export type Row = { name: string; status: Status; statusAt?: number; appearAt?: number };

/** Replica of the app's role box: name + inline sticker + summary, then people rows. */
export function RoleBox({
  name,
  mascot,
  rows,
  addRow = true,
  scale = 1,
  enterAt = 0,
  style,
}: {
  name: string;
  mascot: string;
  rows: Row[];
  addRow?: boolean;
  scale?: number;
  enterAt?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - enterAt, fps, config: { damping: 200 } });
  const visible = rows.filter((r) => r.appearAt === undefined || frame >= r.appearAt);
  const confirmed = visible.filter((r) => r.status === "accepted" && (r.statusAt === undefined || frame >= r.statusAt)).length;
  const summary = visible.length === 0 ? "No one scheduled yet" : confirmed > 0 ? `${confirmed} confirmed` : `${visible.length} scheduled`;
  const s = scale;
  return (
    <div
      style={{
        background: "white",
        border: `${2 * s}px solid ${C.border}`,
        borderRadius: 18 * s,
        overflow: "hidden",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px)`,
        boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
        fontFamily: body,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 * s, padding: `${8 * s}px ${20 * s}px`, borderBottom: `${2 * s}px solid ${C.border}` }}>
        <span style={{ fontSize: 26 * s, fontWeight: 600, color: C.ink, letterSpacing: -0.4 }}>{name}</span>
        <Mascot src={mascot} height={76 * s} delay={enterAt + 6} float={false} />
        <span style={{ marginLeft: "auto", fontSize: 17 * s, color: C.muted }}>{summary}</span>
      </div>
      {visible.map((r) => {
        const appear = r.appearAt === undefined ? 1 : spring({ frame: frame - r.appearAt, fps, config: { damping: 200 } });
        const status: Status = r.statusAt !== undefined && frame < r.statusAt ? (r.status === "accepted" ? "invited" : "draft") : r.status;
        const initials = r.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
        return (
          <div
            key={r.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16 * s,
              padding: `0 ${20 * s}px`,
              height: 82 * s * appear,
              overflow: "hidden",
              borderBottom: `${2 * s}px solid ${C.border}`,
              opacity: appear,
              transform: `translateX(${(1 - appear) * -24}px)`,
            }}
          >
            <div
              style={{
                width: 52 * s,
                height: 52 * s,
                borderRadius: "50%",
                background: C.slateBg,
                border: `${3 * s}px solid ${status === "accepted" ? "#86efac" : C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18 * s,
                fontWeight: 600,
                color: C.muted,
              }}
            >
              {initials}
            </div>
            <span style={{ fontSize: 22 * s, fontWeight: 500, color: C.ink }}>{r.name}</span>
            <span style={{ marginLeft: "auto" }}>
              <Chip status={status} size={18 * s} popAt={r.statusAt} />
            </span>
          </div>
        );
      })}
      {addRow ? (
        <div style={{ padding: `${12 * s}px`, textAlign: "center", fontSize: 19 * s, color: C.muted, background: "#f6f8fb" }}>+ Add Person</div>
      ) : null}
    </div>
  );
}

type CamKey = { at: number; scale: number; x: number; y: number };

/** Browser window showing a screenshot with an animated camera (zoom/pan to x,y as 0–1 of the image). */
export function BrowserShot({
  src,
  width,
  url,
  keys,
  cropBottom = 0.885,
  children,
}: {
  src: string;
  width: number;
  url: string;
  keys: CamKey[];
  cropBottom?: number;
  children?: (toScreen: (x: number, y: number) => { left: number; top: number }) => ReactNode;
}) {
  const frame = useCurrentFrame();
  const imgW = width;
  const imgH = width * (1750 / 2800);
  const viewH = imgH * cropBottom; // hides the dev-tools badge in the screenshot's bottom-left corner
  const at = keys.map((k) => k.at);
  const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
  const scale = interpolate(frame, at, keys.map((k) => k.scale), ease);
  const fx = interpolate(frame, at, keys.map((k) => k.x), ease);
  const fy = interpolate(frame, at, keys.map((k) => k.y), ease);
  // Keep the focus point centred but never pan past the image edges
  const tx = Math.min(0, Math.max(imgW - imgW * scale, imgW / 2 - fx * imgW * scale));
  const ty = Math.min(0, Math.max(viewH - imgH * scale, viewH / 2 - fy * imgH * scale));
  const toScreen = (x: number, y: number) => ({ left: tx + x * imgW * scale, top: ty + y * imgH * scale });
  return (
    <div style={{ position: "relative", width }}>
    <div style={{ width, borderRadius: 22, overflow: "hidden", background: "white", boxShadow: "0 40px 90px rgba(15,23,42,0.25)", border: "2px solid rgba(15,23,42,0.08)" }}>
      <div style={{ height: 54, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", background: "#f2f5f9", borderBottom: `2px solid ${C.border}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
        ))}
        <span style={{ marginLeft: 18, padding: "6px 18px", borderRadius: 999, background: "white", fontFamily: body, fontSize: 17, color: C.muted, border: `1px solid ${C.border}` }}>
          {url}
        </span>
      </div>
      <div style={{ position: "relative", width: imgW, height: viewH, overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{ position: "absolute", left: 0, top: 0, width: imgW, height: imgH, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
        />
      </div>
    </div>
      {/* Overlay outside the clipped window so callouts can extend past its edges */}
      <div style={{ position: "absolute", left: 2, top: 56, width: imgW, height: viewH }}>{children ? children(toScreen) : null}</div>
    </div>
  );
}

/** Speech-bubble callout that pops in at `at`, pointing at its anchor. */
export function Callout({ text, at, left, top, side = "right" }: { text: string; at: number; left: number; top: number; side?: "left" | "right" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left, top, transform: `translate(${side === "right" ? 0 : -100}%, -50%) scale(${s})`, transformOrigin: side === "right" ? "left center" : "right center", opacity: Math.min(1, s * 1.5) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, flexDirection: side === "right" ? "row" : "row-reverse" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: C.primary, boxShadow: `0 0 0 8px rgba(36,91,255,0.25)` }} />
        <span style={{ width: 40, height: 4, background: C.primary }} />
        <span style={{ padding: "16px 26px", borderRadius: 18, background: C.ink, color: "white", fontFamily: body, fontWeight: 600, fontSize: 28, boxShadow: "0 20px 40px rgba(15,23,42,0.3)", whiteSpace: "nowrap" }}>
          {text}
        </span>
      </div>
    </div>
  );
}

export type CursorPoint = { at: number; x: number; y: number; click?: boolean };

/** Mouse pointer gliding between points, with a ripple on clicks. */
export function Cursor({ path }: { path: CursorPoint[] }) {
  const frame = useCurrentFrame();
  const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
  const at = path.map((p) => p.at);
  const x = interpolate(frame, at, path.map((p) => p.x), ease);
  const y = interpolate(frame, at, path.map((p) => p.y), ease);
  const lastClick = [...path].reverse().find((p) => p.click && frame >= p.at);
  const since = lastClick ? frame - lastClick.at : 999;
  const press = since < 8 ? interpolate(since, [0, 3, 8], [1, 0.82, 1]) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 50 }}>
      {since < 20 ? (
        <span
          style={{
            position: "absolute",
            left: -30,
            top: -30,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: `4px solid ${C.primary}`,
            opacity: interpolate(since, [0, 20], [0.9, 0]),
            transform: `scale(${interpolate(since, [0, 20], [0.4, 1.6])})`,
          }}
        />
      ) : null}
      <svg width={44} height={44} viewBox="0 0 24 24" style={{ transform: `scale(${press})`, transformOrigin: "4px 4px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))" }}>
        <path d="M4 3l14 7-6 2-2 6z" fill="white" stroke={C.ink} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Phone mockup; children render inside the screen. */
export function Phone({ children, scale = 1 }: { children: ReactNode; scale?: number }) {
  return (
    <div style={{ width: 400 * scale, height: 820 * scale, borderRadius: 64 * scale, background: "#0f1522", padding: 14 * scale, boxShadow: "0 50px 100px rgba(15,23,42,0.35)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 52 * scale, overflow: "hidden", background: "#f4f7fb" }}>
        <div style={{ position: "absolute", top: 12 * scale, left: "50%", width: 120 * scale, height: 32 * scale, marginLeft: -60 * scale, borderRadius: 999, background: "#0f1522", zIndex: 5 }} />
        {children}
      </div>
    </div>
  );
}

/** Confetti burst from (x, y) at frame `at`; deterministic so every render matches. */
export function Confetti({ at, x = 960, y = 540, count = 70, spread = 1 }: { at: number; x?: number; y?: number; count?: number; spread?: number }) {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 90) return null;
  const colors = [C.primary, C.cyan, PASTEL.pop, PASTEL.sun, "#22c55e", "#a78bfa"];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = random(`a${i}`) * Math.PI * 2;
        const speed = (14 + random(`s${i}`) * 22) * spread;
        const px = x + Math.cos(angle) * speed * t;
        const py = y + Math.sin(angle) * speed * t * 0.75 + 0.55 * t * t;
        const w = 10 + random(`w${i}`) * 12;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: w,
              height: w * 0.45,
              borderRadius: 3,
              background: colors[i % colors.length],
              opacity: interpolate(t, [0, 60, 90], [1, 1, 0], clamp),
              transform: `rotate(${t * (8 + random(`r${i}`) * 14) + i * 37}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

/** Bell icon that rings (swings) for ~20 frames from `ringAt`. */
export function Bell({ size = 40, color = C.ink, ringAt }: { size?: number; color?: string; ringAt?: number }) {
  const frame = useCurrentFrame();
  const since = ringAt === undefined ? 999 : frame - ringAt;
  const swing = since >= 0 && since < 24 ? Math.sin(since * 1.2) * 22 * (1 - since / 24) : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${swing}deg)`, transformOrigin: "50% 8%" }}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function MailIcon({ size = 40, color = C.ink }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

export function TextIcon({ size = 40, color = C.ink }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  );
}

/** Numbered step label shown in a corner of demo scenes. */
export function StepTag({ n, label }: { n: number; label: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14, opacity: s, transform: `translateX(${(1 - s) * -30}px)`, fontFamily: body }}>
      <span style={{ width: 52, height: 52, borderRadius: 16, background: GRADIENT, color: "white", fontWeight: 700, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span style={{ fontSize: 26, fontWeight: 600, color: C.primary, letterSpacing: 2, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
