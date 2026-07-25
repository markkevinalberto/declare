"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CalendarGrid<T>({
  items,
  getDate,
  selectedDay,
  onSelectDay,
}: {
  items: T[];
  getDate: (item: T) => string;
  selectedDay: Date | null;
  onSelectDay: (d: Date | null) => void;
}) {
  const [month, setMonth] = useState(startOfMonth(new Date()));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const key = format(new Date(getDate(item)), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [items, getDate]);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft />
          </Button>
          <p className="text-sm font-medium">{format(month, "MMMM yyyy")}</p>
          <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDay.get(key) ?? [];
            const selected = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  dayItems.length > 0 ? onSelectDay(selected ? null : day) : undefined
                }
                className={cn(
                  "flex h-16 flex-col items-center gap-1 rounded-lg border border-transparent p-1 text-sm",
                  !isSameMonth(day, month) && "text-muted-foreground/40",
                  isToday(day) && "border-border",
                  selected && "bg-primary text-primary-foreground",
                  dayItems.length > 0 && !selected && "bg-muted/60 font-medium"
                )}
              >
                {format(day, "d")}
                {dayItems.length > 0 ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      selected ? "bg-primary-foreground" : "bg-primary"
                    )}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
