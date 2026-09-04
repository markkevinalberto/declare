"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function LandingHeroVisual({ src, alt }: { src: string; alt: string }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      frameRef.current,
      { opacity: 0, y: 28, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9, delay: 0.15, ease: "power3.out" }
    );
  }, []);

  return (
    <div ref={frameRef} className="relative">
      <div
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 via-chart-2/15 to-warm/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/15 ring-1 ring-foreground/5">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
          <span className="size-2.5 rounded-full bg-destructive/40" />
          <span className="size-2.5 rounded-full bg-chart-3/50" />
          <span className="size-2.5 rounded-full bg-chart-2/50" />
        </div>
        <Image src={src} alt={alt} width={1400} height={875} priority className="w-full" />
      </div>
    </div>
  );
}
