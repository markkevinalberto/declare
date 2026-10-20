import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarX2,
  Check,
  Download,
  Monitor,
  MonitorPlay,
  Play,
  Smartphone,
  Sparkles,
  Users,
  Users2,
} from "lucide-react";
import { DeclareMark } from "@/components/brand/declare-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FEATURES as FEATURE_FLAGS } from "@/lib/features";
import { LandingHeroVisual } from "./landing-hero-visual";
import { LandingVideo } from "./landing-video";
import { LandingParallax } from "./landing-parallax";
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
    icon: <CalendarDays className="size-5 text-(--ink)" />,
    tone: "var(--sky)",
    eyebrow: "Service planning",
    title: "Build the whole service flow in minutes",
    description:
      "Lay out songs, scripture, announcements, and sermon segments in order, see the running time update as you go, and keep every service's plan in one place your whole team can see.",
    image: "/marketing/services.png",
    imageAlt: "Service plan builder showing a Sunday service flow with songs, scripture, and segments in order",
    requires: "planning",
  },
  {
    icon: <Users className="size-5 text-(--ink)" />,
    tone: "var(--butter)",
    eyebrow: "Volunteer scheduling",
    title: "Invite volunteers, let them accept or decline",
    description:
      "Assign people to roles, send invites, and get notified the moment someone responds. Declare checks for scheduling conflicts and blockout dates automatically, so you're never double-booking your team.",
    image: "/marketing/dashboard.png",
    imageAlt: "Dashboard showing upcoming services, unfilled positions, and pending volunteer responses",
  },
  {
    icon: <MonitorPlay className="size-5 text-(--ink)" />,
    tone: "var(--lilac)",
    eyebrow: "Live presenter console",
    title: "Run the whole service from one screen",
    description:
      "Drive lyrics, scripture, and announcements to a projector and a separate stage monitor for your team, with countdown timers, a scrolling announcement bar, and full keyboard shortcut control, all from a single console.",
    image: "/marketing/presenter.png",
    imageAlt: "Presenter console with a schedule of songs and slides, live confidence monitor, and playback controls",
    requires: "presenter",
  },
  {
    icon: <Users2 className="size-5 text-(--ink)" />,
    tone: "var(--mint)",
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

const TRUST = [
  { icon: Check, label: "Free to start", tone: "bg-(--mint)" },
  { icon: Smartphone, label: "Android app", tone: "bg-(--sky)" },
  { icon: BellRing, label: "Email & SMS reminders", tone: "bg-(--peach)" },
];

// The landing page keeps its own bright pastel palette in every OS theme —
// it redefines the app tokens for its subtree, so shared components (nav
// buttons, the lineup reel) pick up the pastel values automatically.
const LANDING_CSS = `
  .landing {
    color-scheme: light;
    --background: #f7f9ff;
    --foreground: #14213d;
    --card: #ffffff;
    --card-foreground: #14213d;
    --popover: #ffffff;
    --popover-foreground: #14213d;
    --primary: #245bff;
    --primary-foreground: #ffffff;
    --secondary: #eef2fb;
    --secondary-foreground: #14213d;
    --muted: #eef2fb;
    --muted-foreground: #56627f;
    --accent: #e6edff;
    --accent-foreground: #1d3fb8;
    --border: #e2e7f3;
    --input: #e2e7f3;
    --ring: #245bff;
    /* The app is square-cornered (radius 0); the landing page gets soft, friendly corners */
    --radius: 0.75rem;
    --chart-2: #30d5ff;
    --chart-3: #ffc21a;
    --ink: #14213d;
    --sky: #dcebff;
    --butter: #fff2c6;
    --blush: #ffe0ea;
    --mint: #d6f5e7;
    --lilac: #e9e1ff;
    --peach: #ffe6d5;
    --pop: #ff5c93;
    --sun: #ffc21a;
    background: var(--background);
    color: var(--foreground);
  }
  /* The lineup reel's status chips carry dark-mode text colours; keep them light-theme here */
  .landing .dark\\:text-green-400 { color: var(--color-green-700); }
  .landing .dark\\:text-amber-400 { color: var(--color-amber-700); }
  .landing .dark\\:text-red-400 { color: var(--color-red-700); }

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
  .mascot-wave { animation: mascot-wave 6s cubic-bezier(0.45, 0, 0.55, 1) infinite; }

  /* Stickers wiggle when you poke them */
  @keyframes sticker-wiggle {
    0%, 100% { transform: rotate(0deg) scale(1.06); }
    25% { transform: rotate(-7deg) scale(1.08); }
    75% { transform: rotate(6deg) scale(1.08); }
  }
  .sticker { pointer-events: auto; cursor: grab; transition: filter .3s; }
  .sticker:hover { animation: sticker-wiggle .6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; filter: drop-shadow(0 18px 24px rgb(36 91 255 / .25)); }

  /* Hero depth: children shift against the cursor (set by LandingParallax) */
  .parallax {
    translate: calc(var(--mx, 0) * var(--depth, 20) * 1px) calc(var(--my, 0) * var(--depth, 20) * 1px);
    transition: translate .5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes chip-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .chip-bob { animation: chip-bob 4.5s cubic-bezier(0.45, 0, 0.55, 1) infinite; }

  @keyframes squiggle-draw { to { stroke-dashoffset: 0; } }
  .squiggle { stroke-dasharray: 1; stroke-dashoffset: 1; animation: squiggle-draw 1.1s 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards; }

  /* Sections drift up as they scroll into view (where the browser supports scroll-driven animation) */
  @keyframes reveal-up {
    from { opacity: 0; transform: translateY(36px) scale(0.98); }
    to   { opacity: 1; transform: none; }
  }
  @supports (animation-timeline: view()) {
    .reveal { animation: reveal-up linear both; animation-timeline: view(); animation-range: entry 0% entry 35%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .mascot-float, .mascot-wave, .chip-bob, .sticker:hover, .reveal { animation: none; }
    .parallax { translate: none; }
    .squiggle { animation: none; stroke-dashoffset: 0; }
  }
`;

const pillPrimary =
  "group inline-flex items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]";
const pillArrow =
  "flex size-9 items-center justify-center rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105";

export function LandingPage() {
  return (
    <div className="landing min-h-svh overflow-x-hidden">
      <style>{LANDING_CSS}</style>

      <div className="sticky top-4 z-50 mx-auto flex max-w-fit items-center gap-1 rounded-full bg-white/80 px-2 py-1.5 shadow-lg shadow-primary/10 ring-1 ring-(--border) backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 pr-2 pl-1.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2">
            <DeclareMark className="size-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Declare</span>
        </Link>
        <a href="#tour" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden rounded-full sm:inline-flex")}>
          Tour
        </a>
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
        {/* Hero: pastel colour mesh behind, headline left, live lineup reel right */}
        <section className="relative -mt-16 pt-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-48 -right-40 size-[38rem] rounded-full bg-(--sky) blur-3xl" />
            <div className="absolute top-40 -left-48 size-[30rem] rounded-full bg-(--blush) blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 size-[28rem] rounded-full bg-(--butter) blur-3xl" />
            <div className="absolute top-1/3 right-1/4 size-[18rem] rounded-full bg-(--mint) blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(rgb(20_33_61/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
          </div>

          <LandingParallax className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 pt-20 pb-24 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-(--lilac) px-3.5 py-1.5 text-xs font-semibold tracking-wide text-(--ink) ring-1 ring-white">
                <Sparkles className="size-3.5 text-primary" /> Made for church media &amp; worship teams
              </span>
              <h1 className="mt-6 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Run your church{" "}
                <span
                  className="mx-0.5 inline-flex size-8 shrink-0 translate-y-1 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 align-middle shadow-lg shadow-primary/30 sm:size-10"
                  aria-hidden="true"
                >
                  <DeclareMark className="size-4.5 text-primary-foreground sm:size-5.5" />
                </span>{" "}
                without the{" "}
                <span className="relative inline-block whitespace-nowrap">
                  spreadsheet
                  <svg
                    viewBox="0 0 300 20"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="absolute -bottom-2 left-0 h-3 w-full text-(--pop) sm:-bottom-3 sm:h-4"
                  >
                    <path
                      d="M3 13 C 45 3, 85 19, 135 10 S 235 3, 297 11"
                      pathLength={1}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="squiggle"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-7 max-w-lg text-lg text-muted-foreground text-balance">
                Declare schedules volunteers, tracks who&apos;s accepted, and
                reminds anyone who hasn&apos;t, so a role never sits empty until
                Sunday morning.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup" className={pillPrimary}>
                  Get started free
                  <span className={pillArrow}>
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
                <a
                  href="#tour"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-5 pl-1.5 font-semibold text-(--ink) shadow-sm ring-1 ring-(--border) transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-(--blush) transition-transform duration-500 group-hover:scale-110">
                    <Play className="size-4 fill-(--pop) text-(--pop)" />
                  </span>
                  Watch the tour
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-2">
                {TRUST.map(({ icon: Icon, label, tone }) => (
                  <li
                    key={label}
                    className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-(--ink)", tone)}
                  >
                    <Icon className="size-3.5" /> {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="parallax [--depth:10]">
                {/* Animated (Remotion) lineup: roles fill in and flip to Confirmed, on loop */}
                <LandingHeroVisual>
                  <RosterReelPlayer {...HERO_REEL} loop />
                </LandingHeroVisual>
              </div>

              {/* Floating status chips — what Declare does while you're not looking */}
              <div className="parallax pointer-events-none absolute -top-5 -left-3 z-20 [--depth:28] sm:-left-8">
                <div className="chip-bob flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-(--ink) shadow-xl shadow-primary/10 ring-1 ring-(--border)">
                  <span className="flex size-6 items-center justify-center rounded-full bg-(--mint)">
                    <Check className="size-3.5 text-green-700" />
                  </span>
                  Ana accepted
                </div>
              </div>
              <div className="parallax pointer-events-none absolute -bottom-6 left-6 z-20 hidden [--depth:34] sm:block">
                <div className="chip-bob flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-(--ink) shadow-xl shadow-primary/10 ring-1 ring-(--border) [animation-delay:-1.5s]">
                  <span className="flex size-6 items-center justify-center rounded-full bg-(--butter)">
                    <BellRing className="size-3.5 text-amber-700" />
                  </span>
                  Reminder sent · 3 days to go
                </div>
              </div>
              <div className="parallax pointer-events-none absolute -right-2 bottom-24 z-20 hidden [--depth:22] lg:block">
                <div className="chip-bob flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-(--ink) shadow-xl shadow-primary/10 ring-1 ring-(--border) [animation-delay:-3s]">
                  <span className="flex size-6 items-center justify-center rounded-full bg-(--blush)">
                    <CalendarX2 className="size-3.5 text-(--pop)" />
                  </span>
                  Blockout flagged
                </div>
              </div>

              {/* Peeks over the top-right corner, above the reel's empty header edge */}
              <div className="parallax pointer-events-none absolute -top-12 -right-2 z-30 [--depth:40] sm:-top-20 sm:-right-4 lg:-top-28 lg:-right-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/full/boy_thumbs_tablet.png"
                  alt=""
                  aria-hidden="true"
                  className="mascot-float sticker h-28 w-auto drop-shadow-xl sm:h-36 lg:h-48"
                />
              </div>
            </div>
          </LandingParallax>
        </section>

        <LandingMarquee />

        <section id="tour" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-20 sm:px-6 sm:pt-28">
          <div className="reveal rounded-[2.5rem] bg-gradient-to-br from-(--sky) via-(--lilac) to-(--blush) p-2 shadow-xl shadow-primary/10">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-white/55 px-4 pt-12 pb-6 ring-1 ring-white sm:px-10 sm:pt-14 sm:pb-10">
              {/* Two camera operators "filming" the tour from either side of the heading */}
              <div className="relative mb-8 px-20 text-center sm:px-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/full/boy_dslr.png"
                  alt=""
                  aria-hidden="true"
                  className="sticker absolute bottom-0 left-0 h-20 w-auto drop-shadow-lg sm:h-32"
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
                  className="sticker absolute right-0 bottom-0 h-20 w-auto drop-shadow-lg sm:h-32"
                />
              </div>
              <LandingVideo />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pt-24 pb-24 sm:pt-32 sm:pb-32">
          <div className="reveal mb-14 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">Everything Sunday needs</p>
              <h2 className="mt-2 max-w-xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Plan it, staff it, and run it from one place
              </h2>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/full/duo_case.png"
              alt=""
              aria-hidden="true"
              className="sticker hidden h-28 w-auto shrink-0 drop-shadow-xl sm:block lg:h-36"
            />
          </div>
          <LandingFeatureShowcase features={FEATURES} />
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-32">
          <div className="reveal mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">Built for the whole team</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Something for everyone who serves
              </h2>
            </div>
            <LandingBuiltFor />
          </div>
        </section>

        {FEATURE_FLAGS.presenter ? (
          <section id="desktop-app" className="scroll-mt-16 px-4 pb-24 sm:px-6">
            <div className="reveal mx-auto max-w-5xl rounded-[2.5rem] bg-(--lilac) px-6 py-16 text-center sm:py-20">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/40">
                <Monitor className="size-7 text-primary-foreground" />
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-(--ink)">
                Desktop app
              </div>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Run the presenter console as a native Windows app
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-balance">
                Install Declare on the machine that runs your projector for real
                fullscreen on any monitor, reliable multi-display output for
                your projector and stage screen, and none of the popup-blocker
                or permission hassles that come with running it in a browser
                tab.
              </p>
              <div className="mt-8">
                <a href={DESKTOP_DOWNLOAD_URL} className={pillPrimary}>
                  <Download className="size-4" /> Download for Windows
                  <span className={pillArrow}>
                    <ArrowRight className="size-4" />
                  </span>
                </a>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Free for Windows 10 and 11.</p>
            </div>
          </section>
        ) : null}

        <section className="px-4 pt-10 pb-24 sm:px-6">
          <div className="reveal relative mx-auto max-w-6xl rounded-[2.5rem] bg-gradient-to-r from-(--butter) via-(--peach) to-(--blush) px-6 pt-14 pb-12 sm:px-14 sm:py-16">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
              <div className="absolute -top-10 left-1/3 size-40 rounded-full bg-white/40 blur-2xl" />
              <span className="absolute top-8 left-8 size-3 rounded-full bg-(--pop)/60" />
              <span className="absolute bottom-10 left-1/2 size-2 rounded-full bg-primary/50" />
              <span className="absolute top-1/2 left-[42%] size-2.5 rounded-full bg-(--sun)" />
            </div>
            {/* Stands on the panel's top edge, clear of the heading and button */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/full/girl_tablet_wave.png"
              alt=""
              aria-hidden="true"
              className="mascot-wave sticker absolute -top-16 right-4 z-10 h-28 w-auto drop-shadow-xl sm:-top-20 sm:right-12 sm:h-44"
            />
            <div className="relative max-w-2xl pr-20 sm:pr-0">
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                Ready to run your next service with Declare?
              </h2>
              <p className="mt-3 text-lg text-(--ink)/70">Free to get started, no credit card required.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup" className={pillPrimary}>
                  Get started free
                  <span className={pillArrow}>
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="rounded-full px-5 py-3 font-semibold text-(--ink) transition-colors hover:bg-white/60"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2">
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
