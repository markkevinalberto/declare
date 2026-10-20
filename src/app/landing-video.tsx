"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const VIDEOS = {
  promo: { label: "1-minute promo", src: "/videos/declare-promo.mp4", poster: "/videos/declare-promo-poster.jpg" },
  demo: { label: "Full product tour", src: "/videos/declare-demo.mp4", poster: "/videos/declare-demo-poster.jpg" },
} as const;

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function LandingVideo() {
  const [which, setWhich] = useState<keyof typeof VIDEOS>("promo");
  const reducedMotion = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => true);
  const video = VIDEOS[which];

  return (
    <div>
      <div className="mx-auto flex w-fit gap-1 rounded-full border bg-card p-1">
        {(Object.keys(VIDEOS) as (keyof typeof VIDEOS)[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setWhich(key)}
            aria-pressed={which === key}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              which === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {VIDEOS[key].label}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-[1.5rem] bg-card shadow-[0_30px_70px_-30px_rgb(36_91_255/0.45)] ring-4 ring-white">
        <video
          key={video.src}
          className="aspect-video w-full bg-black"
          src={video.src}
          poster={video.poster}
          // Starts muted (browsers block sound on autoplay); viewers unmute for the voice-over
          autoPlay={!reducedMotion}
          muted
          loop={which === "promo"}
          playsInline
          controls
          preload="metadata"
        />
      </div>
    </div>
  );
}
