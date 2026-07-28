"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, List, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarGrid } from "@/components/shared/calendar-grid";
import { formatInOrgTime } from "@/lib/org-time";
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
        services={dayFiltered ?? upcoming}
        isScheduler={isScheduler}
        timezone={timezone}
        emptyLabel={
          selectedDay ? "No services on this day." : "No upcoming services yet."
        }
      />

      {!selectedDay && past.length > 0 ? (
        <ServiceList
          title="Past"
          services={past}
          isScheduler={isScheduler}
          timezone={timezone}
          muted
        />
      ) : null}
    </div>
  );
}

function ServiceList({
  title,
  services,
  isScheduler,
  timezone,
  emptyLabel,
  muted,
}: {
  title?: string;
  services: Service[];
  isScheduler: boolean;
  timezone: string;
  emptyLabel?: string;
  muted?: boolean;
}) {
  return (
    <div className="grid gap-2">
      {title ? (
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      ) : null}
      {services.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" /> {emptyLabel}
        </p>
      ) : (
        <div className="grid gap-2">
          {services.map((service) => (
            <Card key={service.id} className={muted ? "opacity-70" : undefined}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <Link
                  href={`/services/${service.id}`}
                  className="flex min-w-0 flex-1 flex-col gap-0.5"
                >
                  <span className="font-medium">{service.title}</span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {formatInOrgTime(service.starts_at, timezone, "EEE, MMM d yyyy · h:mm a")}
                    {service.campus ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {service.campus}
                      </span>
                    ) : null}
                  </span>
                </Link>
                {isScheduler ? (
                  <ServiceRowActions serviceId={service.id} title={service.title} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

