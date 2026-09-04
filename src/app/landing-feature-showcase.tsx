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
      // Pin the title/description column for the length of the scrolling
      // image stack on the right, so the reader keeps their place while the
      // "which feature is this" context stays visible the whole time.
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 96px",
        end: () => `+=${(containerRef.current?.offsetHeight ?? 0) - (pinRef.current?.offsetHeight ?? 0)}`,
        pin: pinRef.current,
      });

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

      // Each screenshot starts small and dim, grows to full size and
      // opacity as it crosses the viewport center, then eases back down as
      // it leaves — a scroll-scrubbed reveal rather than an on/off toggle.
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
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
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
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i === active ? "bg-primary" : "bg-border"
              )}
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
              className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/10 ring-1 ring-foreground/5"
            >
              <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
                <span className="size-2.5 rounded-full bg-destructive/40" />
                <span className="size-2.5 rounded-full bg-chart-3/50" />
                <span className="size-2.5 rounded-full bg-chart-2/50" />
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
        ))}
      </div>
    </div>
  );
}
