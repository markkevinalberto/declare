"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONES, timezoneLabel } from "@/lib/timezones";

export function TimezoneSelect({
  id,
  name = "timezone",
  defaultValue,
}: {
  id?: string;
  name?: string;
  defaultValue: string;
}) {
  // Include the stored value even if it isn't in the curated list, so an
  // org saved with an uncommon zone doesn't show blank.
  const zones = TIMEZONES.includes(defaultValue as (typeof TIMEZONES)[number])
    ? [...TIMEZONES]
    : [defaultValue, ...TIMEZONES];

  return (
    <Select
      name={name}
      defaultValue={defaultValue}
      items={zones.map((tz) => ({ value: tz, label: timezoneLabel(tz) }))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {zones.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {timezoneLabel(tz)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
