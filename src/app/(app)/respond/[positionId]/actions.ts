"use server";

import { revalidatePath } from "next/cache";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { positionResponseEmail } from "@/lib/email/templates";

export type RespondState = { error?: string; success?: "accepted" | "declined" } | undefined;

export async function respondToPosition(
  positionId: string,
  action: "accept" | "decline"
): Promise<RespondState> {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: position } = await supabase
    .from("positions")
    .select(
      "id, status, user_id, created_by, service_id, services(title, starts_at), roles(name)"
    )
    .eq("id", positionId)
    .single();

  if (!position) return { error: "This invite could not be found." };
  if (position.user_id !== profile.id) {
    return { error: "This invite isn't addressed to you." };
  }
  if (position.status === "draft") {
    return { error: "This assignment hasn't been sent yet." };
  }

  const newStatus = action === "accept" ? "accepted" : "declined";
  if (position.status === newStatus) {
    return { success: newStatus };
  }
  const { error } = await supabase
    .from("positions")
    .update({ status: newStatus })
    .eq("id", positionId);
  if (error) return { error: error.message };

  await supabase.rpc("notify_position_response", { p_position_id: positionId });

  const service = position.services as unknown as { title: string; starts_at: string } | null;
  const role = position.roles as unknown as { name: string } | null;
  const [{ data: leader }, { data: org }] = await Promise.all([
    supabase.from("profiles").select("name, email").eq("id", position.created_by).single(),
    supabase.from("organizations").select("name").eq("id", profile.org_id).single(),
  ]);

  if (service && role && leader) {
    const { data: emailEnabled } = await supabase.rpc("get_email_preference", {
      p_user_id: position.created_by,
      p_category: newStatus,
    });
    if (emailEnabled !== false) {
      const orgName = org?.name ?? "your church";
      const { subject, html } = positionResponseEmail({
        orgName,
        leaderName: leader.name || leader.email,
        volunteerName: profile.name || profile.email,
        serviceTitle: service.title,
        roleName: role.name,
        status: newStatus,
        serviceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/services/${position.service_id}`,
      });
      await sendEmail({ to: leader.email, subject, html, fromName: orgName });
    }
  }

  revalidatePath("/my-schedule");
  revalidatePath(`/services/${position.service_id}`);
  return { success: newStatus };
}
