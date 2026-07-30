import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Supabase's free tier pauses a project after 7 days with no API activity —
 * a church that goes quiet for a week would otherwise come back to a paused
 * database and a broken app. The reminders cron already touches the
 * database daily, but that's incidental to its own job; this route's only
 * purpose is to guarantee at least one real API request per day regardless
 * of what else runs.
 */
async function handleKeepWarm(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .select("id", { head: true, count: "exact" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}

export const GET = handleKeepWarm;
export const POST = handleKeepWarm;
