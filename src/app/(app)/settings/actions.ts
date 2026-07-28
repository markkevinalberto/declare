"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { orgInviteEmail } from "@/lib/email/templates";

export type SettingsActionState = { error?: string; success?: string } | undefined;

const updateOrgSchema = z.object({
  name: z.string().min(2, "Church name must be at least 2 characters."),
  timezone: z.string().min(1, "Timezone is required."),
});

export async function updateOrganization(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const profile = await requireAdmin();
  const parsed = updateOrgSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update(parsed.data)
    .eq("id", profile.org_id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: "Organization updated." };
}

export async function regenerateJoinLink(): Promise<SettingsActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("regenerate_join_token");
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: "New link generated. Old links no longer work." };
}

const inviteSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  role: z.enum(["admin", "leader", "member"]),
});

export async function createInvite(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const profile = await requireAdmin();
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const [{ data: org }, { data: invite, error }] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", profile.org_id).single(),
    supabase
      .from("org_invites")
      .insert({
        org_id: profile.org_id,
        email: parsed.data.email,
        role: parsed.data.role,
        invited_by: profile.id,
      })
      .select("token")
      .single(),
  ]);

  if (error) {
    if (error.code === "23505") {
      return { error: "That email has already been invited." };
    }
    return { error: error.message };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { subject, html } = orgInviteEmail({
    orgName: org?.name ?? "your church",
    inviterName: profile.name || profile.email,
    role: parsed.data.role,
    acceptUrl: `${siteUrl}/invite/${invite.token}`,
  });
  await sendEmail({ to: parsed.data.email, subject, html });

  revalidatePath("/settings");
  return { success: `Invite sent to ${parsed.data.email}.` };
}

export async function revokeInvite(inviteId: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("org_invites")
    .delete()
    .eq("id", inviteId)
    .eq("org_id", profile.org_id);
  revalidatePath("/settings");
}

export async function deleteOrganization(
  confirmName: string
): Promise<SettingsActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_organization", {
    p_confirm_name: confirmName,
  });
  if (error) return { error: error.message };
  redirect("/onboarding");
}
