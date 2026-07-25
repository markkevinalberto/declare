"use server";

import { revalidatePath } from "next/cache";
import { requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type SelfSignUpState = { error?: string; warning?: string } | undefined;

const CONFLICT_LABEL: Record<string, string> = {
  blockout: "you've marked yourself unavailable that day",
  double_booked: "you're already serving elsewhere that day",
};

export async function selfSignUpForRole(
  serviceId: string,
  roleId: string
): Promise<SelfSignUpState> {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: holdsRole } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("org_id", profile.org_id)
    .eq("user_id", profile.id)
    .eq("role_id", roleId)
    .maybeSingle();
  if (!holdsRole) {
    return { error: "You don't hold that role." };
  }

  const { data: existing } = await supabase
    .from("positions")
    .select("id")
    .eq("service_id", serviceId)
    .eq("role_id", roleId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (existing) {
    return { error: "You're already scheduled for this role." };
  }

  const now = new Date().toISOString();
  const { data: position, error } = await supabase
    .from("positions")
    .insert({
      org_id: profile.org_id,
      service_id: serviceId,
      role_id: roleId,
      user_id: profile.id,
      status: "accepted",
      invited_at: now,
      responded_at: now,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !position) {
    return { error: error?.message ?? "Could not sign up for this role." };
  }

  await supabase.rpc("notify_self_signup", { p_position_id: position.id });

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/my-schedule");
  revalidatePath("/dashboard");

  const { data: conflicts } = await supabase.rpc("scheduling_conflicts", {
    p_user_id: profile.id,
    p_service_id: serviceId,
  });
  const warning = conflicts?.length
    ? `Heads up: ${conflicts.map((c) => CONFLICT_LABEL[c.conflict_type] ?? c.conflict_type).join(" and ")}.`
    : undefined;

  return warning ? { warning } : undefined;
}
