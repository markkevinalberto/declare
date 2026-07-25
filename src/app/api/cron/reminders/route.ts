import { NextResponse } from "next/server";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { reminderEmail } from "@/lib/email/templates";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function dayRange(daysFromNow: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysFromNow);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function sendRemindersForWindow(
  admin: ReturnType<typeof createAdminClient>,
  daysFromNow: number,
  kind: "3_day" | "1_day"
) {
  const { start, end } = dayRange(daysFromNow);

  const { data: services } = await admin
    .from("services")
    .select("id, title, starts_at, org_id")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString());

  let sent = 0;

  for (const service of services ?? []) {
    const { data: positions } = await admin
      .from("positions")
      .select("id, status, user_id, roles(name), profiles!positions_user_id_fkey(name, email)")
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
      } | null;
      if (!role || !volunteer) continue;

      const { data: pref } = await admin
        .from("notification_preferences")
        .select("email_enabled")
        .eq("user_id", position.user_id!)
        .eq("category", "reminder")
        .maybeSingle();

      if (pref?.email_enabled !== false) {
        const { subject, html } = reminderEmail({
          volunteerName: volunteer.name || volunteer.email,
          serviceTitle: service.title,
          serviceDate: format(new Date(service.starts_at), "EEEE, MMMM d, yyyy · h:mm a"),
          roleName: role.name,
          daysAway: daysFromNow,
          status: position.status as "invited" | "accepted",
          respondUrl:
            position.status === "invited"
              ? `${siteUrl()}/respond/${position.id}`
              : `${siteUrl()}/my-schedule`,
        });
        await sendEmail({ to: volunteer.email, subject, html });
      }

      await admin.from("notifications").insert({
        org_id: service.org_id,
        user_id: position.user_id!,
        type: "reminder",
        title: `Reminder: ${role.name} for ${service.title}`,
        body: format(new Date(service.starts_at), "EEEE, MMMM d, yyyy · h:mm a"),
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
