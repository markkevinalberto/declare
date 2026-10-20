"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export type ShowcaseFeature = {
  // A pre-rendered icon element, not a component reference — component
  // types/functions can't cross the server->client prop boundary, only
  // serializable data and already-rendered JSX can.
  icon: React.ReactNode;
  // Pastel colour (a CSS colour value) for this feature's chip, bar and frame
  tone: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export function LandingFeatureShowcase({ features }: { features: ShowcaseFeature[] }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Pin the title/description column for the length of the scrolling
      // image stack on the right, so the reader keeps their place while the
      // "which feature is this" context stays visible the whole time. Skips
      // entirely under reduced motion — pinning is a motion effect, not just
      // a layout choice.
      if (!reduceMotion) {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top 96px",
          end: () => `+=${(containerRef.current?.offsetHeight ?? 0) - (pinRef.current?.offsetHeight ?? 0)}`,
          pin: pinRef.current,
        });
      }

      // Tracks which feature is nearest to keep the sidebar text in sync —
      // a discrete state swap, not an animation, so this stays on even
      // under reduced motion.
      itemRefs.current.forEach((item, i) => {
        if (!item) return;
        ScrollTrigger.create({
          trigger: item,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
        });
      });

      if (reduceMotion) return;

      // Each screenshot starts small and dim, grows to full size and
      // opacity as it crosses the viewport center, then eases back down as
      // it leaves, a scroll-scrubbed reveal rather than an on/off toggle.
      imageRefs.current.forEach((image) => {
        if (!image) return;
        gsap.fromTo(
          image,
          { scale: 0.85, opacity: 0.35 },
          {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: image,
              start: "top 85%",
              end: "top 40%",
              scrub: true,
            },
          }
        );
        gsap.to(image, {
          scale: 0.92,
          opacity: 0.4,
          ease: "none",
          scrollTrigger: {
            trigger: image,
            start: "bottom 45%",
            end: "bottom 5%",
            scrub: true,
          },
        });
      });
    },
    { scope: containerRef, dependencies: [features] }
  );

  return (
    <div ref={containerRef} className="grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16">
      <div ref={pinRef} className="h-fit">
        {features.map((feature, i) => (
            <div
              key={feature.title}
              className={cn(
                "transition-opacity duration-300",
                i === active ? "opacity-100" : "hidden opacity-0"
              )}
            >
              <span
                className="flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white"
                style={{ background: feature.tone }}
              >
                {feature.icon}
              </span>
              <div className="mt-4 text-sm font-medium text-primary">{feature.eyebrow}</div>
              <h3 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {feature.title}
              </h3>
              <p className="mt-3 text-muted-foreground text-balance">{feature.description}</p>
            </div>
        ))}
        <div className="mt-6 flex gap-1.5">
          {features.map((feature, i) => (
            <span
              key={feature.title}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-[background-color,flex-grow] duration-500",
                i === active ? "grow-[2] bg-primary" : ""
              )}
              style={i === active ? undefined : { background: feature.tone }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-24">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
          >
            <div
              ref={(el) => {
                imageRefs.current[i] = el;
              }}
              // Double bezel: the feature's pastel tray holding the app window
              className="rounded-[1.75rem] p-2 shadow-[0_30px_70px_-30px_rgb(36_91_255/0.35)]"
              style={{ background: feature.tone }}
            >
              <div className="overflow-hidden rounded-[calc(1.75rem-0.5rem)] bg-card ring-1 ring-white">
                <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-(--pop)/70" />
                  <span className="size-2.5 rounded-full bg-(--sun)" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <Image
                  src={feature.image}
                  alt={feature.imageAlt}
                  width={1400}
                  height={875}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
