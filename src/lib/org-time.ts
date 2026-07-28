import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// date-fns's format() reads local Date getters, so it renders in whatever
// timezone the CODE runs in (server host time in a Server Component, viewer
// browser time in a Client Component) — never the org's configured timezone.
// toZonedTime shifts the instant so those same local getters read back the
// wall-clock time for `timezone` instead, regardless of where the code runs.
export function toOrgTime(date: Date | string, timezone: string): Date {
  return toZonedTime(date, timezone);
}

export function formatInOrgTime(
  date: Date | string,
  timezone: string,
  formatStr: string
): string {
  return format(toOrgTime(date, timezone), formatStr);
}
