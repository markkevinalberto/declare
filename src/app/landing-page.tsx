import Link from "next/link";
import { CalendarDays, Download, Monitor, MonitorPlay, Users, Users2 } from "lucide-react";
import { DeclareMark } from "@/components/brand/declare-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FEATURES as FEATURE_FLAGS } from "@/lib/features";
import { LandingHeroVisual } from "./landing-hero-visual";
import { LandingVideo } from "./landing-video";
import { RosterReelPlayer } from "@/components/remotion/roster-reel-player";
import type { RosterReelProps } from "@/components/remotion/roster-reel";
import { distinctMascots } from "@/lib/mascots";
import { LandingMarquee } from "./landing-marquee";
import { LandingFeatureShowcase, type ShowcaseFeature } from "./landing-feature-showcase";
import { LandingBuiltFor } from "./landing-built-for";

// Windows installer — hosted as a GitHub release rather than bundled into
// the Vercel deployment (it's ~80MB, and the app icon/screenshots already
// live here; no reason to bloat the site build with a desktop binary).
// Bump the tag/filename together when a new build is released.
const DESKTOP_DOWNLOAD_URL =
  "https://github.com/markkevinalberto/declare/releases/download/v0.1.0/Declare-Setup-0.1.0.exe";

const ALL_FEATURES: (ShowcaseFeature & { requires?: "planning" | "presenter" })[] = [
  {
    icon: <CalendarDays className="size-5 text-primary-foreground" />,
    eyebrow: "Service planning",
    title: "Build the whole service flow in minutes",
    description:
      "Lay out songs, scripture, announcements, and sermon segments in order, see the running time update as you go, and keep every service's plan in one place your whole team can see.",
    image: "/marketing/services.png",
    imageAlt: "Service plan builder showing a Sunday service flow with songs, scripture, and segments in order",
    requires: "planning",
  },
  {
    icon: <Users className="size-5 text-primary-foreground" />,
    eyebrow: "Volunteer scheduling",
    title: "Invite volunteers, let them accept or decline",
    description:
      "Assign people to roles, send invites, and get notified the moment someone responds. Declare checks for scheduling conflicts and blockout dates automatically, so you're never double-booking your team.",
    image: "/marketing/dashboard.png",
    imageAlt: "Dashboard showing upcoming services, unfilled positions, and pending volunteer responses",
  },
  {
    icon: <MonitorPlay className="size-5 text-primary-foreground" />,
    eyebrow: "Live presenter console",
    title: "Run the whole service from one screen",
    description:
      "Drive lyrics, scripture, and announcements to a projector and a separate stage monitor for your team, with countdown timers, a scrolling announcement bar, and full keyboard shortcut control, all from a single console.",
    image: "/marketing/presenter.png",
    imageAlt: "Presenter console with a schedule of songs and slides, live confidence monitor, and playback controls",
    requires: "presenter",
  },
  {
    icon: <Users2 className="size-5 text-primary-foreground" />,
    eyebrow: "Team & roles",
    title: "One roster for your entire volunteer team",
    description:
      "See everyone in your church, what roles they can serve in, and their permission level at a glance. Message a role, a whole team, or an individual, and let Declare handle reminders for anyone who hasn't responded yet.",
    image: "/marketing/people.png",
    imageAlt: "People page showing a roster of volunteers with their roles and permissions",
  },
];

const FEATURES = ALL_FEATURES.filter((f) => !f.requires || FEATURE_FLAGS[f.requires]);

// Sample lineup for the hero animation (fictional volunteers)
const HERO_ROLES: [string, string][] = [
  ["Main Cam CH 1", "Joshua P."],
  ["Livestream", "Ana R."],
  ["Sound Engineer", "Paolo C."],
  ["Slides & Lyrics", "Grace L."],
  ["Photographer", "Mia T."],
  ["Technical Director", "Ken D."],
];
const HERO_MASCOTS = distinctMascots(HERO_ROLES.map(([role]) => [role]));
const HERO_REEL: RosterReelProps = {
  eyebrow: "Media team",
  title: "Sunday Worship",
  when: "Sun · 9:00 AM",
  mode: "demo",
  roles: HERO_ROLES.map(([name, person], i) => ({ name, person, mascot: HERO_MASCOTS[i], status: "invited" })),
};

export function LandingPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-background">
      <style>{`
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
          50%       { transform: translateY(-16px) rotate(1.5deg); }
        }
        @keyframes mascot-entrance {
          0%   { transform: translateY(40px) rotate(-1.5deg); opacity: 0; filter: blur(6px); }
          100% { transform: translateY(0px)  rotate(-1.5deg); opacity: 1; filter: blur(0);  }
        }
        .mascot-float {
          animation:
            mascot-entrance 0.9s cubic-bezier(0.32, 0.72, 0, 1) 0.3s both,
            mascot-float    5s  cubic-bezier(0.45, 0, 0.55, 1)   1.2s infinite;
        }
        @keyframes mascot-wave {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50%       { transform: translateY(-10px) rotate(-1deg); }
        }
        .mascot-wave {
          animation: mascot-wave 6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
      `}</style>
      <div className="sticky top-4 z-50 mx-auto flex max-w-fit items-center gap-1 rounded-full border bg-card/80 px-2 py-1.5 shadow-lg shadow-foreground/5 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 pr-2 pl-1.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2">
            <DeclareMark className="size-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Declare</span>
        </Link>
        {FEATURE_FLAGS.presenter ? (
          <a
            href="#desktop-app"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden rounded-full sm:inline-flex")}
          >
            <Monitor /> Desktop
          </a>
        ) : null}
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}>
          Sign in
        </Link>
        <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
          Get started
        </Link>
      </div>

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-12 overflow-visible px-6 pt-20 pb-8 sm:pt-24 lg:grid-cols-2 lg:gap-8">
          <div>
            <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Run your church{" "}
              <span
                className="mx-0.5 inline-flex size-8 shrink-0 translate-y-1 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 align-middle sm:size-10"
                aria-hidden="true"
              >
                <DeclareMark className="size-4.5 text-primary-foreground sm:size-5.5" />
              </span>{" "}
              without the spreadsheet
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground text-balance">
              Declare schedules volunteers, tracks who&apos;s accepted, and
              reminds anyone who hasn&apos;t, so a role never sits empty until
              Sunday morning.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Get started free
              </Link>
              <a href="#tour" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Watch the tour
              </a>
            </div>
          </div>

          <div className="relative">
            {/* Animated (Remotion) lineup: roles fill in and flip to Confirmed, on loop */}
            <LandingHeroVisual>
              <RosterReelPlayer {...HERO_REEL} loop />
            </LandingHeroVisual>
            {/* Peeks over the top-right corner, above the reel's empty header edge */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/full/boy_thumbs_tablet.png"
              alt=""
              aria-hidden="true"
              className="mascot-float pointer-events-none absolute -right-2 -top-12 z-20 h-28 w-auto drop-shadow-xl sm:-right-4 sm:-top-20 sm:h-36 lg:-right-8 lg:-top-28 lg:h-48"
            />
          </div>
        </section>

        <div className="mt-16">
          <LandingMarquee />
        </div>

        <section id="tour" className="mx-auto max-w-5xl scroll-mt-24 px-6 pt-24">
          {/* Two camera operators "filming" the tour from either side of the heading */}
          <div className="relative mb-8 px-20 text-center sm:px-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/full/boy_dslr.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 h-20 w-auto drop-shadow-lg sm:h-32"
            />
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">See it in action</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Declare in under a minute
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/full/girl_dslr.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-0 bottom-0 h-20 w-auto drop-shadow-lg sm:h-32"
            />
          </div>
          <LandingVideo />
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <LandingFeatureShowcase features={FEATURES} />
        </section>

        <section className="relative border-t bg-card/40 py-24 sm:py-32">
          {/* Stands on the section's top edge; its feet stay inside the top padding */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/full/duo_case.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -top-14 left-4 z-10 h-24 w-auto drop-shadow-xl sm:-top-20 sm:left-10 sm:h-36"
          />
          <div className="mx-auto max-w-5xl px-6">
            <LandingBuiltFor />
          </div>
        </section>

        {FEATURE_FLAGS.presenter ? (
          <section id="desktop-app" className="scroll-mt-16 border-t bg-[#08121F] text-white">
            <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-28">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/40">
                <Monitor className="size-7 text-primary-foreground" />
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90">
                Desktop app
              </div>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Run the presenter console as a native Windows app
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70 text-balance">
                Install Declare on the machine that runs your projector for real
                fullscreen on any monitor, reliable multi-display output for
                your projector and stage screen, and none of the popup-blocker
                or permission hassles that come with running it in a browser
                tab.
              </p>
              <div className="mt-8">
                <a href={DESKTOP_DOWNLOAD_URL} className={buttonVariants({ size: "lg" })}>
                  <Download /> Download for Windows
                </a>
              </div>
              <p className="mt-4 text-xs text-white/50">Free for Windows 10 and 11.</p>
            </div>
          </section>
        ) : null}

        <section className="border-t bg-muted/30">
          <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
            {/* Stands on the section's top edge directly above the CTA button —
                its bottom stops at the row's top padding so it never covers it */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/full/girl_tablet_wave.png"
              alt=""
              aria-hidden="true"
              className="mascot-wave pointer-events-none absolute -top-16 right-4 z-10 h-28 w-auto drop-shadow-xl lg:-top-20 lg:right-8 lg:h-40"
            />
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Ready to run your next service with Declare?
              </h2>
              <p className="mt-2 text-muted-foreground">Free to get started, no credit card required.</p>
            </div>
            <Button size="lg" nativeButton={false} render={<Link href="/signup" />} className="shrink-0">
              Get started free
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-chart-2">
              <DeclareMark className="size-3.5 text-primary-foreground" />
            </span>
            <span className="font-medium text-foreground">Declare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <p>&copy; {new Date().getFullYear()} Declare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
