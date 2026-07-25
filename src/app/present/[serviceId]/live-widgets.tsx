"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Maximize } from "lucide-react";
import { cn } from "@/lib/utils";
import { isElectron } from "./electron-bridge";

/** mm:ss (or h:mm:ss over an hour), clamped at 0:00 once time is up. */
export function formatCountdown(msLeft: number) {
  const total = Math.max(0, Math.ceil(msLeft / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * The current time (epoch ms), ticking every 250ms. Starts at 0 — matching
 * what the server renders, since `Date.now()` can't be computed identically
 * on the server and the client — and only reflects the real clock from the
 * first tick after mount, a plain post-mount update rather than a value
 * baked into the initial render (which is what would actually mismatch).
 */
export function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Ticking countdown text for a fixed end time (epoch ms). */
export function CountdownText({
  endsAt,
  className,
  warnClassName,
}: {
  endsAt: number;
  className?: string;
  /** Applied instead of className during the final minute (e.g. red). */
  warnClassName?: string;
}) {
  const now = useNow();
  const msLeft = endsAt - now;
  return (
    <span
      className={cn(
        "tabular-nums",
        warnClassName && msLeft <= 60_000 ? warnClassName : className
      )}
    >
      {formatCountdown(msLeft)}
    </span>
  );
}

function subscribeFullscreen(callback: () => void) {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}
function getFullscreenSnapshot() {
  // Electron's projector/stage windows are made native-fullscreen from the
  // main process (electron/src/windows.js) — that never touches the DOM
  // Fullscreen API, so document.fullscreenElement would stay null forever
  // and this prompt would sit on screen permanently. Treat "running inside
  // the desktop shell" as always-fullscreen instead.
  return isElectron() || Boolean(document.fullscreenElement);
}
function getFullscreenServerSnapshot() {
  return false;
}

/** Whether the page is currently fullscreen — hydration-safe. */
export function useIsFullscreen() {
  return useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getFullscreenServerSnapshot
  );
}

/**
 * Covers the screen with a "tap to enter fullscreen" prompt until fullscreen
 * is entered. Browsers never auto-fullscreen a newly opened tab/window
 * without a user gesture inside THAT document — opening this tab doesn't
 * count, no matter how it was opened — so a one-shot automatic attempt is
 * made on mount (works in some browsers where activation carries over) and,
 * when that's blocked, this prompt is the one tap needed instead of relying
 * on the easy-to-miss double-click-anywhere toggle.
 */
export function FullscreenPrompt() {
  const isFullscreen = useIsFullscreen();

  useEffect(() => {
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  if (isFullscreen) return null;

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.requestFullscreen().catch(() => {});
      }}
      className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-3 bg-black/85 text-white"
    >
      <Maximize className="size-10" />
      <span className="text-lg font-semibold">Tap to enter fullscreen</span>
    </button>
  );
}

/**
 * Bottom-of-screen scrolling ticker. The host screen's root must have
 * `container-type` set — the animation distance is in container units so
 * the same component works fullscreen and in the small monitor preview.
 */
export function CrawlBar({ text }: { text: string }) {
  // Slow enough to read, scaled by message length, looped forever.
  const duration = Math.max(10, Math.round(text.length * 0.35));
  return (
    <div className="absolute inset-x-0 bottom-0 overflow-hidden bg-black/75 py-[1cqh]">
      <p
        className="w-max whitespace-nowrap font-semibold text-white will-change-transform"
        style={{
          fontSize: "min(3.6cqw, 5.5cqh)",
          animation: `presenter-crawl ${duration}s linear infinite`,
        }}
      >
        {text}
      </p>
    </div>
  );
}
