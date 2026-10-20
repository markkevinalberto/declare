"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Player } from "@remotion/player";
import {
  REEL_FPS,
  RosterReel,
  reelColumns,
  reelDuration,
  reelHeight,
  type RosterReelProps,
} from "./roster-reel";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function RosterReelPlayer({
  loop = false,
  className,
  ...reel
}: RosterReelProps & { loop?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED).matches,
    () => false
  );

  // Composition is sized to the container so text renders crisp at 1:1
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const roles = reel.roles.slice(0, reelColumns(width) === 1 ? 4 : 6);
  const duration = reelDuration(reel.mode, roles.length);
  const height = reelHeight(width || 600, roles.length);

  return (
    <div ref={ref} className={className} style={{ minHeight: width ? undefined : height }}>
      {width > 0 ? (
        <Player
          component={RosterReel}
          inputProps={{ ...reel, roles }}
          durationInFrames={duration}
          fps={REEL_FPS}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: "100%", height }}
          autoPlay={!reducedMotion}
          loop={loop && !reducedMotion}
          initialFrame={reducedMotion ? duration - 1 : 0}
          moveToBeginningWhenEnded={false}
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
        />
      ) : null}
    </div>
  );
}
