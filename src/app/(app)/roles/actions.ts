"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type RolesActionState = { error?: string } | undefined;

const nameSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
});

export async function createRoleGroup(
  _prevState: RolesActionState,
  formData: FormData
): Promise<RolesActionState> {
  const profile = await requireAdmin();
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("role_groups")
    .select("id", { count: "exact", head: true })
    .eq("org_id", profile.org_id);

  const { error } = await supabase.from("role_groups").insert({
    org_id: profile.org_id,
    name: parsed.data.name,
    sort_order: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/roles");
  return undefined;
}

export async function updateRoleGroup(
  groupId: string,
  _prevState: RolesActionState,
  formData: FormData
): Promise<RolesActionState> {
  const profile = await requireAdmin();
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("role_groups")
    .update({ name: parsed.data.name })
    .eq("id", groupId)
    .eq("org_id", profile.org_id);
  if (error) return { error: error.message };

  revalidatePath("/roles");
  return undefined;
}

export async function deleteRoleGroup(groupId: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("role_groups")
    .delete()
    .eq("id", groupId)
    .eq("org_id", profile.org_id);
  revalidatePath("/roles");
}

export async function createRole(
  groupId: string,
  _prevState: RolesActionState,
  formData: FormData
): Promise<RolesActionState> {
  const profile = await requireAdmin();
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("roles")
    .select("id", { count: "exact", head: true })
    .eq("role_group_id", groupId);

  const { error } = await supabase.from("roles").insert({
    org_id: profile.org_id,
    role_group_id: groupId,
    name: parsed.data.name,
    sort_order: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/roles");
  return undefined;
}

export async function updateRole(
  roleId: string,
  _prevState: RolesActionState,
  formData: FormData
): Promise<RolesActionState> {
  const profile = await requireAdmin();
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("roles")
    .update({ name: parsed.data.name })
    .eq("id", roleId)
    .eq("org_id", profile.org_id);
  if (error) return { error: error.message };

  revalidatePath("/roles");
  return undefined;
}

export async function deleteRole(roleId: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("roles")
    .delete()
    .eq("id", roleId)
    .eq("org_id", profile.org_id);
  revalidatePath("/roles");
}

export async function setRoleMembers(roleId: string, userIds: string[]) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role_id", roleId);

  const currentIds = new Set((current ?? []).map((r) => r.user_id));
  const nextIds = new Set(userIds);

  const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    await supabase.from("user_roles").insert(
      toAdd.map((userId) => ({
        org_id: profile.org_id,
        user_id: userId,
        role_id: roleId,
      }))
    );
  }

  if (toRemove.length > 0) {
    await supabase
      .from("user_roles")
      .delete()
      .eq("role_id", roleId)
      .in("user_id", toRemove);
  }

  revalidatePath("/roles");
  revalidatePath("/people");
}
