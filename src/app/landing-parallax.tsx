"use client";

import { useRef } from "react";

// Tracks the mouse over the hero and exposes it as --mx / --my (-0.5…0.5),
// which `.parallax` children turn into a gentle depth shift. Touch input is
// ignored so phones don't jitter on scroll.
export function LandingParallax({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    ref.current.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  }

  function handleLeave() {
    ref.current?.style.setProperty("--mx", "0");
    ref.current?.style.setProperty("--my", "0");
  }

  return (
    <div ref={ref} onPointerMove={handleMove} onPointerLeave={handleLeave} className={className}>
      {children}
    </div>
  );
}
