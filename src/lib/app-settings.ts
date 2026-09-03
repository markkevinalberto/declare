import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Defaults to enabled if the settings row/table doesn't exist yet (e.g.
 * migration not applied), matching the behavior before this toggle existed
 * — no silent regression, the toggle only takes effect once actually set up. */
export async function getSmsRemindersEnabled(): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("sms_reminders_enabled")
    .eq("id", true)
    .maybeSingle();
  return data?.sms_reminders_enabled ?? true;
}
