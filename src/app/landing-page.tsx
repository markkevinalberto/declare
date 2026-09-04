import Link from "next/link";
import { CalendarDays, Download, Monitor, MonitorPlay, Users, Users2 } from "lucide-react";
import { DeclareMark } from "@/components/brand/declare-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FEATURES as FEATURE_FLAGS } from "@/lib/features";
import { LandingHeroVisual } from "./landing-hero-visual";
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
      "Drive lyrics, scripture, and announcements to a projector and a separate stage monitor for your team, with countdown timers, a scrolling announcement bar, and full keyboard shortcut control — all from a single console.",
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

export function LandingPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-background">
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
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-20 pb-8 sm:pt-28 lg:grid-cols-2 lg:gap-8">
          <div>
            <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
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
              Declare schedules volunteers, tracks who&apos;s accepted, and reminds
              everyone who hasn&apos;t — so Sunday morning isn&apos;t the first time you
              find out a role is empty.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Get started free
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Sign in
              </Link>
            </div>
          </div>

          <LandingHeroVisual
            src="/marketing/dashboard.png"
            alt="The Declare dashboard, showing upcoming services, unfilled positions, and pending volunteer responses"
          />
        </section>

        <div className="mt-16">
          <LandingMarquee />
        </div>

        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <LandingFeatureShowcase features={FEATURES} />
        </section>

        <section className="border-t bg-card/40 py-24 sm:py-32">
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
              <p className="mt-4 text-xs text-white/50">Free · Windows 10/11 · v0.1.0</p>
            </div>
          </section>
        ) : null}

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-28">
            <h2 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Ready to run your next service with Declare?
            </h2>
            <p className="mt-3 text-muted-foreground">Free to get started — no credit card required.</p>
            <div className="mt-8">
              <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
                Get started free
              </Button>
            </div>
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
          <p>&copy; {new Date().getFullYear()} Declare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
