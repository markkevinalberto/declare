"use client";

import { useState } from "react";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { CalendarDays, List, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarGrid } from "@/components/shared/calendar-grid";
import { RespondButtons } from "../respond/[positionId]/respond-buttons";

type Row = {
  id: string;
  status: "draft" | "invited" | "accepted" | "declined";
  service: { id: string; title: string; starts_at: string; campus: string | null };
  role: { name: string } | null;
};

export function MyScheduleView({ rows }: { rows: Row[] }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const now = new Date();
  const upcoming = rows.filter((r) => new Date(r.service.starts_at) >= now);
  const past = rows.filter((r) => new Date(r.service.starts_at) < now).reverse();

  const dayFiltered = selectedDay
    ? upcoming.filter((r) => isSameDay(new Date(r.service.starts_at), selectedDay))
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
          items={upcoming}
          getDate={(r) => r.service.starts_at}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      ) : null}

      {dayFiltered ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Appointments on {format(selectedDay!, "MMMM d, yyyy")}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="grid gap-2">
        {(dayFiltered ?? upcoming).length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <CalendarDays className="size-4 text-muted-foreground" />
                {selectedDay ? "Nothing that day" : "Nothing scheduled yet"}
              </CardTitle>
              {!selectedDay ? (
                <CardDescription>
                  You&apos;ll see appointments here once a leader invites you to
                  serve.
                </CardDescription>
              ) : null}
            </CardHeader>
          </Card>
        ) : (
          (dayFiltered ?? upcoming).map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {r.role?.name} — {r.service.title}
                </CardTitle>
                <CardDescription className="flex flex-col gap-0.5">
                  <span>{format(new Date(r.service.starts_at), "EEEE, MMMM d, yyyy · h:mm a")}</span>
                  {r.service.campus ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {r.service.campus}
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <RespondButtons positionId={r.id} status={r.status} />
                {r.status === "accepted" ? (
                  <Link
                    href={`/services/${r.service.id}`}
                    className="text-sm font-medium text-primary underline underline-offset-4"
                  >
                    View service plan
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!selectedDay && past.length > 0 ? (
        <div className="grid gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Past</h2>
          {past.map((r) => (
            <Card key={r.id} className="opacity-70">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {r.role?.name} — {r.service.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(r.service.starts_at), "MMM d, yyyy")}
                  </p>
                </div>
                <span className="text-sm capitalize text-muted-foreground">{r.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
