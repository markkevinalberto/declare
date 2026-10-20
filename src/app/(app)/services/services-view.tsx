"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, List, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarGrid } from "@/components/shared/calendar-grid";
import { formatInOrgTime } from "@/lib/org-time";
import { cn } from "@/lib/utils";
import { ServiceRowActions } from "./service-row-actions";

type Service = {
  id: string;
  title: string;
  starts_at: string;
  campus: string | null;
  series_id: string | null;
};

export function ServicesView({
  services,
  isScheduler,
  timezone,
}: {
  services: Service[];
  isScheduler: boolean;
  timezone: string;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const now = new Date();
  const upcoming = services.filter((s) => new Date(s.starts_at) >= now);
  const past = [...services.filter((s) => new Date(s.starts_at) < now)].reverse();

  // Compare by org-local calendar day (yyyy-MM-dd), not isSameDay's system-local
  // comparison — selectedDay itself is just a calendar-nav day key, not an instant.
  const dayFiltered = selectedDay
    ? services.filter(
        (s) =>
          formatInOrgTime(s.starts_at, timezone, "yyyy-MM-dd") ===
          format(selectedDay, "yyyy-MM-dd")
      )
    : null;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-1">
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("list")}
        >
          <List /> List
        </Button>
        <Button
          variant={view === "calendar" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setView("calendar")}
        >
          <CalendarDays /> Calendar
        </Button>
      </div>

      {view === "calendar" ? (
        <CalendarGrid
          items={services}
          getDate={(s) => s.starts_at}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          timezone={timezone}
        />
      ) : null}

      {dayFiltered ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Services on {format(selectedDay!, "MMMM d, yyyy")}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
            Clear
          </Button>
        </div>
      ) : null}

      <ServiceList
        title={selectedDay ? undefined : "Upcoming"}
        tone="upcoming"
        services={dayFiltered ?? upcoming}
        nextId={upcoming[0]?.id}
        now={now}
        isScheduler={isScheduler}
        timezone={timezone}
        emptyLabel={
          selectedDay ? "No services on this day." : "No upcoming services yet."
        }
      />

      {!selectedDay && past.length > 0 ? (
        <ServiceList
          title="Past"
          tone="past"
          services={past}
          now={now}
          isScheduler={isScheduler}
          timezone={timezone}
        />
      ) : null}
    </div>
  );
}

function ServiceList({
  title,
  tone,
  services,
  nextId,
  now,
  isScheduler,
  timezone,
  emptyLabel,
}: {
  title?: string;
  tone: "upcoming" | "past";
  services: Service[];
  nextId?: string;
  now: Date;
  isScheduler: boolean;
  timezone: string;
  emptyLabel?: string;
}) {
  return (
    <div className="grid gap-2">
      {title ? (
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", tone === "upcoming" ? "bg-primary" : "bg-muted-foreground/40")}
          />
          {title}
          <span className="tabular-nums text-muted-foreground/70">{services.length}</span>
        </h2>
      ) : null}
      {services.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" /> {emptyLabel}
        </p>
      ) : (
        <div className="grid gap-2">
          {services.map((service) => {
            // Each tile colours itself by its own date, so a calendar-day list
            // that mixes past and upcoming still reads correctly
            const isPast = new Date(service.starts_at) < now;
            const isNext = service.id === nextId;
            return (
              <Card
                key={service.id}
                className={cn(
                  isPast
                    ? "bg-muted/50 ring-foreground/5"
                    : "bg-primary/[0.04] ring-primary/25 dark:bg-primary/[0.08]",
                  isNext && "ring-2 ring-primary/50"
                )}
              >
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <Link
                    href={`/services/${service.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {/* Date block: blue for upcoming (solid for the next one), grey once it's past */}
                    <span
                      className={cn(
                        "flex size-12 shrink-0 flex-col items-center justify-center rounded-lg leading-none",
                        isPast
                          ? "bg-muted text-muted-foreground"
                          : isNext
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                            : "bg-primary/10 text-primary"
                      )}
                    >
                      <span className="text-[10px] font-semibold tracking-wider uppercase">
                        {formatInOrgTime(service.starts_at, timezone, "MMM")}
                      </span>
                      <span className="mt-0.5 text-lg font-semibold tabular-nums">
                        {formatInOrgTime(service.starts_at, timezone, "d")}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className={cn("flex items-center gap-2 font-medium", isPast && "text-muted-foreground")}>
                        <span className="truncate">{service.title}</span>
                        {isNext ? (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                            Next up
                          </span>
                        ) : null}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        {formatInOrgTime(service.starts_at, timezone, "EEE, MMM d yyyy · h:mm a")}
                        {service.campus ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" /> {service.campus}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                  {isScheduler ? (
                    <ServiceRowActions serviceId={service.id} title={service.title} />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

