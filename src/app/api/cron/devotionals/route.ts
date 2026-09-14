import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { devotionalEmail } from "@/lib/email/templates";
import { formatInOrgTime, toOrgTime } from "@/lib/org-time";
import { sendSms } from "@/lib/sms";

type Devotional = {
  id: string;
  title: string;
  scripture_reference: string;
  scripture_text: string | null;
  reflection: string;
  reflection_question: string | null;
  prayer: string | null;
  sort_order: number;
};

/**
 * Picks the devotional after whichever one was last sent to this org (by
 * sort_order), wrapping back to the first — so the weekly send cycles
 * through the whole library on its own instead of needing a devotional
 * scheduled for every specific date.
 */
async function pickNextDevotional(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string
): Promise<Devotional | null> {
  const { data: devotionals } = await admin
    .from("devotionals")
    .select(
      "id, title, scripture_reference, scripture_text, reflection, reflection_question, prayer, sort_order"
    )
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true });
  if (!devotionals || devotionals.length === 0) return null;

  const { data: lastLog } = await admin
    .from("devotional_log")
    .select("devotional_id")
    .eq("org_id", orgId)
    .order("sent_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSortOrder = lastLog?.devotional_id
    ? devotionals.find((d) => d.id === lastLog.devotional_id)?.sort_order
    : undefined;

  if (lastSortOrder === undefined) return devotionals[0];
  return devotionals.find((d) => d.sort_order > lastSortOrder) ?? devotionals[0];
}

async function sendDevotionalForOrg(
  admin: ReturnType<typeof createAdminClient>,
  org: { id: string; name: string; timezone: string }
) {
  // Local getters (getDay, format) on a toOrgTime() result read the org's
  // own wall-clock day, exactly like the reminders cron's per-org timezone
  // checks — see src/lib/org-time.ts.
  if (toOrgTime(new Date(), org.timezone).getDay() !== 0) return 0;

  const sentOn = formatInOrgTime(new Date(), org.timezone, "yyyy-MM-dd");
  const { data: existing } = await admin
    .from("devotional_log")
    .select("id")
    .eq("org_id", org.id)
    .eq("sent_on", sentOn)
    .maybeSingle();
  if (existing) return 0;

  const devotional = await pickNextDevotional(admin, org.id);
  if (!devotional) return 0;

  const { data: people } = await admin
    .from("profiles")
    .select("id, email, phone")
    .eq("org_id", org.id)
    .eq("active", true);
  if (!people || people.length === 0) return 0;

  const { subject, html } = devotionalEmail({
    orgName: org.name,
    title: devotional.title,
    scriptureReference: devotional.scripture_reference,
    scriptureText: devotional.scripture_text,
    reflection: devotional.reflection,
    reflectionQuestion: devotional.reflection_question,
    prayer: devotional.prayer,
  });
  // The full multi-paragraph reflection reads well in email but doesn't fit
  // a text message — send the opening hook and the closing prayer instead
  // of the whole thing, pointing to email for the rest.
  const openingLine = devotional.reflection.split(/\n\s*\n/)[0];
  const smsText = [
    `📖 ${devotional.title}`,
    devotional.scripture_reference,
    devotional.scripture_text ? `"${devotional.scripture_text}"` : null,
    "",
    openingLine,
    devotional.prayer ? `\nPrayer: ${devotional.prayer}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  let recipients = 0;
  for (const person of people) {
    const { data: pref } = await admin
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", person.id)
      .eq("category", "devotional")
      .maybeSingle();

    if (pref?.email_enabled !== false) {
      await sendEmail({ to: person.email, subject, html, fromName: org.name });
    }
    if (person.phone) {
      await sendSms(person.phone, smsText);
    }
    await admin.from("notifications").insert({
      org_id: org.id,
      user_id: person.id,
      type: "devotional",
      title: devotional.title,
      body: devotional.scripture_reference,
      link: "/dashboard",
    });
    recipients += 1;
  }

  await admin.from("devotional_log").insert({
    org_id: org.id,
    devotional_id: devotional.id,
    sent_on: sentOn,
    recipient_count: recipients,
  });

  return recipients;
}

async function handleDevotionals(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, timezone")
    .eq("devotionals_enabled", true);

  const results: { orgId: string; sent: number }[] = [];
  for (const org of orgs ?? []) {
    results.push({ orgId: org.id, sent: await sendDevotionalForOrg(admin, org) });
  }

  return NextResponse.json({
    totalSent: results.reduce((sum, r) => sum + r.sent, 0),
    results,
  });
}

// Vercel Cron invokes scheduled routes with GET; support POST too for
// manually/externally triggered runs. Runs once daily (vercel.json) at
// 22:00 UTC — 6:00 AM for a UTC+8 org (our real org is Asia/Hong_Kong) —
// and internally no-ops on every day but the one that lands on Sunday in
// each org's own timezone, so one daily tick is enough to catch it weekly.
export const GET = handleDevotionals;
export const POST = handleDevotionals;
