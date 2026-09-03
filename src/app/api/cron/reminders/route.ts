import { differenceInCalendarDays } from "date-fns";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { reminderEmail } from "@/lib/email/templates";
import { formatInOrgTime, toOrgTime } from "@/lib/org-time";
import { sendSms } from "@/lib/sms";
import { renderNamedSmsTemplate } from "@/lib/sms-templates";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// "N days away" has to mean N calendar days in the SERVICE'S OWN org
// timezone, not the server's — a naive server-local-midnight window can be
// off by up to the org's UTC offset near a day boundary. Query a window
// wide enough to cover every timezone's own version of "daysFromNow" (26h
// of slack on each side comfortably covers the +/-14h extremes), then
// filter precisely per-service using its own org's timezone below.
function queryWindow(daysFromNow: number) {
  const now = new Date();
  const bufferMs = 26 * 60 * 60 * 1000;
  const start = new Date(now.getTime() - bufferMs);
  const end = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000 + bufferMs);
  return { now, start, end };
}

async function sendRemindersForWindow(
  admin: ReturnType<typeof createAdminClient>,
  daysFromNow: number,
  kind: "3_day" | "1_day"
) {
  const { now, start, end } = queryWindow(daysFromNow);

  const { data: services } = await admin
    .from("services")
    .select("id, title, starts_at, org_id, organizations(name, timezone)")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString());

  let sent = 0;

  for (const service of services ?? []) {
    const org = service.organizations as unknown as { name: string; timezone: string } | null;
    const orgTimezone = org?.timezone ?? "UTC";

    // Precise, per-org-timezone check: is this service exactly `daysFromNow`
    // calendar days away, as measured in ITS OWN timezone?
    const daysAway = differenceInCalendarDays(
      toOrgTime(service.starts_at, orgTimezone),
      toOrgTime(now, orgTimezone)
    );
    if (daysAway !== daysFromNow) continue;

    const { data: positions } = await admin
      .from("positions")
      .select("id, status, user_id, roles(name), profiles!positions_user_id_fkey(name, email, phone)")
      .eq("service_id", service.id)
      .in("status", ["invited", "accepted"]);

    for (const position of positions ?? []) {
      const { data: existing } = await admin
        .from("reminder_log")
        .select("id")
        .eq("position_id", position.id)
        .eq("kind", kind)
        .maybeSingle();
      if (existing) continue;

      const role = position.roles as unknown as { name: string } | null;
      const volunteer = position.profiles as unknown as {
        name: string;
        email: string;
        phone: string | null;
      } | null;
      if (!role || !volunteer) continue;

      const { data: pref } = await admin
        .from("notification_preferences")
        .select("email_enabled")
        .eq("user_id", position.user_id!)
        .eq("category", "reminder")
        .maybeSingle();

      const serviceDate = formatInOrgTime(service.starts_at, orgTimezone, "EEEE, MMMM d, yyyy · h:mm a");
      const respondUrl =
        position.status === "invited"
          ? `${siteUrl()}/respond/${position.id}`
          : `${siteUrl()}/my-schedule`;

      if (pref?.email_enabled !== false) {
        const orgName = org?.name ?? "your church";
        const { subject, html } = reminderEmail({
          orgName,
          volunteerName: volunteer.name || volunteer.email,
          serviceTitle: service.title,
          serviceDate,
          roleName: role.name,
          daysAway: daysFromNow,
          status: position.status as "invited" | "accepted",
          respondUrl,
        });
        await sendEmail({ to: volunteer.email, subject, html, fromName: orgName });
      }

      if (volunteer.phone) {
        const smsText = await renderNamedSmsTemplate(
          service.org_id,
          position.status === "invited" ? "reminder_pending" : "reminder_confirmed",
          {
            role: role.name,
            service: service.title,
            when: serviceDate,
            daysAway: String(daysFromNow),
            respondUrl,
          }
        );
        await sendSms(volunteer.phone, smsText);
      }

      await admin.from("notifications").insert({
        org_id: service.org_id,
        user_id: position.user_id!,
        type: "reminder",
        title: `Reminder: ${role.name} for ${service.title}`,
        body: formatInOrgTime(service.starts_at, orgTimezone, "EEEE, MMMM d, yyyy · h:mm a"),
        link: position.status === "invited" ? `/respond/${position.id}` : "/my-schedule",
      });

      await admin.from("reminder_log").insert({ position_id: position.id, kind });
      sent += 1;
    }
  }

  return sent;
}

async function handleReminders(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const sent3Day = await sendRemindersForWindow(admin, 3, "3_day");
  const sent1Day = await sendRemindersForWindow(admin, 1, "1_day");

  return NextResponse.json({ sent3Day, sent1Day });
}

// Vercel Cron invokes scheduled routes with GET; support POST too for
// manually/externally triggered runs (e.g. cron-job.org, curl).
export const GET = handleReminders;
export const POST = handleReminders;
