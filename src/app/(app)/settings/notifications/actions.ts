"use server";

import { revalidatePath } from "next/cache";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type NotificationType = Database["public"]["Tables"]["notification_preferences"]["Row"]["category"];

export async function setEmailPreference(category: NotificationType, enabled: boolean) {
  const profile = await requireOrgProfile();
  const supabase = await createClient();
  await supabase
    .from("notification_preferences")
    .upsert({ user_id: profile.id, category, email_enabled: enabled });
  revalidatePath("/settings/notifications");
}
