import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  MonitorPlay,
  Users,
  Users2,
} from "lucide-react";
import { DeclareMark } from "@/components/brand/declare-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Feature = {
  icon: typeof CalendarDays;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

const FEATURES: Feature[] = [
  {
    icon: CalendarDays,
    eyebrow: "Service planning",
    title: "Build the whole service flow in minutes",
    description:
      "Lay out songs, scripture, announcements, and sermon segments in order, see the running time update as you go, and keep every service's plan in one place your whole team can see.",
    image: "/marketing/services.png",
    imageAlt: "Service plan builder showing a Sunday service flow with songs, scripture, and segments in order",
  },
  {
    icon: Users,
    eyebrow: "Volunteer scheduling",
    title: "Invite volunteers, let them accept or decline",
    description:
      "Assign people to roles, send invites, and get notified the moment someone responds. Declare checks for scheduling conflicts and blockout dates automatically, so you're never double-booking your team.",
    image: "/marketing/dashboard.png",
    imageAlt: "Dashboard showing upcoming services, unfilled positions, and pending volunteer responses",
  },
  {
    icon: MonitorPlay,
    eyebrow: "Live presenter console",
    title: "Run the whole service from one screen",
    description:
      "Drive lyrics, scripture, and announcements to a projector and a separate stage monitor for your team, with countdown timers, a scrolling announcement bar, and full keyboard shortcut control — all from a single console.",
    image: "/marketing/presenter.png",
    imageAlt: "Presenter console with a schedule of songs and slides, live confidence monitor, and playback controls",
  },
  {
    icon: Users2,
    eyebrow: "Team & roles",
    title: "One roster for your entire volunteer team",
    description:
      "See everyone in your church, what roles they can serve in, and their permission level at a glance. Message a role, a whole team, or an individual, and let Declare handle reminders for anyone who hasn't responded yet.",
    image: "/marketing/people.png",
    imageAlt: "People page showing a roster of volunteers with their roles and permissions",
  },
];

function ScreenshotFrame({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/10 ring-1 ring-foreground/5">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
        <span className="size-2.5 rounded-full bg-destructive/40" />
        <span className="size-2.5 rounded-full bg-chart-3/50" />
        <span className="size-2.5 rounded-full bg-chart-2/50" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={875}
        priority={priority}
        className="w-full"
      />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 shadow-md shadow-primary/25">
              <DeclareMark className="size-4.5 text-primary-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Declare</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center sm:pt-24">
          <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Plan services, schedule volunteers, and run the room —
            <span className="text-primary"> all in one place</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-balance">
            Declare is the church operating system for teams that plan
            Sunday services, schedule volunteers, and present live — built to
            replace the spreadsheet, the group chat, and the separate
            presentation software all at once.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Get started free
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Sign in
            </Link>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <ScreenshotFrame
              src="/marketing/presenter.png"
              alt="The Declare presenter console, showing a service schedule, live slide preview, and playback controls"
              priority
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="grid gap-20 sm:gap-28">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const reversed = i % 2 === 1;
              return (
                <div
                  key={feature.title}
                  className={cn(
                    "grid items-center gap-10 sm:grid-cols-2 sm:gap-16",
                    reversed && "sm:[&>*:first-child]:order-2"
                  )}
                >
                  <ScreenshotFrame src={feature.image} alt={feature.imageAlt} />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Icon className="size-4" />
                      {feature.eyebrow}
                    </div>
                    <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                      {feature.title}
                    </h2>
                    <p className="mt-3 text-muted-foreground text-balance">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance">
              Ready to run your next service with Declare?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Free to get started — no credit card required.
            </p>
            <div className="mt-7">
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
