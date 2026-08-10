"use server";

import { revalidatePath } from "next/cache";
import { requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { positionInviteEmail } from "@/lib/email/templates";
import { formatInOrgTime } from "@/lib/org-time";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function getConflicts(userId: string, serviceId: string) {
  await requireScheduler();
  const supabase = await createClient();
  const { data } = await supabase.rpc("scheduling_conflicts", {
    p_user_id: userId,
    p_service_id: serviceId,
  });
  return data ?? [];
}

export async function createPosition(
  serviceId: string,
  roleId: string,
  userId: string
) {
  const profile = await requireScheduler();
  const supabase = await createClient();
  await supabase.from("positions").insert({
    org_id: profile.org_id,
    service_id: serviceId,
    role_id: roleId,
    user_id: userId,
    status: "draft",
    created_by: profile.id,
  });
  revalidatePath(`/services/${serviceId}`);
}

export async function deletePosition(positionId: string, serviceId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();
  await supabase
    .from("positions")
    .delete()
    .eq("id", positionId)
    .eq("org_id", profile.org_id);
  revalidatePath(`/services/${serviceId}`);
}

async function loadPositionForInvite(supabase: Awaited<ReturnType<typeof createClient>>, positionId: string) {
  const { data } = await supabase
    .from("positions")
    .select(
      "id, status, service_id, user_id, services(title, starts_at, org_id, organizations(name, timezone)), roles(name), profiles!positions_user_id_fkey(name, email)"
    )
    .eq("id", positionId)
    .single();
  return data;
}

async function dispatchInvite(positionId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const position = await loadPositionForInvite(supabase, positionId);
  // Draft: the first send. Invited: a scheduler-triggered resend for
  // someone who hasn't responded yet — everything else (accepted/declined)
  // already has an answer, so there's nothing to (re-)send.
  if (!position || (position.status !== "draft" && position.status !== "invited")) {
    return;
  }

  const service = position.services as unknown as {
    title: string;
    starts_at: string;
    org_id: string;
    organizations: { name: string; timezone: string } | null;
  } | null;
  const role = position.roles as unknown as { name: string } | null;
  const volunteer = position.profiles as unknown as {
    name: string;
    email: string;
  } | null;
  if (!service || !role || !volunteer || !position.user_id) return;

  const orgTimezone = service.organizations?.timezone ?? "UTC";

  await supabase
    .from("positions")
    .update({ status: "invited", invited_at: new Date().toISOString() })
    .eq("id", positionId);

  await supabase.from("notifications").insert({
    org_id: service.org_id,
    user_id: position.user_id,
    type: "invite",
    title: `You're invited: ${role.name} for ${service.title}`,
    body: formatInOrgTime(service.starts_at, orgTimezone, "EEEE, MMMM d, yyyy · h:mm a"),
    link: "/my-schedule",
  });

  const { data: emailEnabled } = await supabase.rpc("get_email_preference", {
    p_user_id: position.user_id,
    p_category: "invite",
  });
  if (emailEnabled !== false) {
    const orgName = service.organizations?.name ?? "your church";
    const { subject, html } = positionInviteEmail({
      orgName,
      volunteerName: volunteer.name || volunteer.email,
      serviceTitle: service.title,
      serviceDate: formatInOrgTime(service.starts_at, orgTimezone, "EEEE, MMMM d, yyyy · h:mm a"),
      roleName: role.name,
      acceptUrl: `${siteUrl()}/respond/${positionId}?action=accept`,
      declineUrl: `${siteUrl()}/respond/${positionId}?action=decline`,
    });
    await sendEmail({ to: volunteer.email, subject, html, fromName: orgName });
  }

  void profile;
}

export async function sendInvite(positionId: string, serviceId: string) {
  await dispatchInvite(positionId);
  revalidatePath(`/services/${serviceId}`);
}

export async function sendAllInvites(serviceId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: drafts } = await supabase
    .from("positions")
    .select("id")
    .eq("service_id", serviceId)
    .eq("org_id", profile.org_id)
    .eq("status", "draft");

  for (const draft of drafts ?? []) {
    await dispatchInvite(draft.id);
  }

  revalidatePath(`/services/${serviceId}`);
}

export async function resendAllPendingInvites(serviceId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: invited } = await supabase
    .from("positions")
    .select("id")
    .eq("service_id", serviceId)
    .eq("org_id", profile.org_id)
    .eq("status", "invited");

  for (const position of invited ?? []) {
    await dispatchInvite(position.id);
  }

  revalidatePath(`/services/${serviceId}`);
}
