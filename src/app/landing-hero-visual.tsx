"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function LandingHeroVisual({
  src,
  alt = "",
  children,
}: {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
}) {
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
    // Double bezel: a frosted pastel tray holding the app window
    <div ref={frameRef} className="relative">
      <div
        className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-(--sky) via-(--lilac) to-(--blush) opacity-90 blur-2xl"
        aria-hidden="true"
      />
      <div className="rounded-[2rem] bg-white/60 p-2 shadow-[0_40px_90px_-30px_rgb(36_91_255/0.45)] ring-1 ring-white backdrop-blur">
        <div className="overflow-hidden rounded-[calc(2rem-0.5rem)] bg-card ring-1 ring-(--border)">
          <div className="flex items-center gap-1.5 border-b bg-(--muted)/60 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-(--pop)/70" />
            <span className="size-2.5 rounded-full bg-(--sun)" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          {children ?? (src ? <Image src={src} alt={alt} width={1400} height={875} priority className="w-full" /> : null)}
        </div>
      </div>
    </div>
  );
}
