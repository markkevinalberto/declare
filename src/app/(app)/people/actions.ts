"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type PersonActionState = { error?: string } | undefined;

const personSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().optional(),
});

export async function updatePerson(
  personId: string,
  _prevState: PersonActionState,
  formData: FormData
): Promise<PersonActionState> {
  const profile = await requireAdmin();
  const parsed = personSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ name: parsed.data.name, phone: parsed.data.phone ?? null })
    .eq("id", personId)
    .eq("org_id", profile.org_id);
  if (error) return { error: error.message };

  revalidatePath("/people");
  revalidatePath("/roles");
  return undefined;
}

export async function setPersonActive(personId: string, active: boolean) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", personId)
    .eq("org_id", profile.org_id);
  if (error) throw new Error(error.message);
  revalidatePath("/people");
}

export async function setPersonPermissionLevel(
  personId: string,
  role: "admin" | "leader" | "member"
) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role })
    .eq("id", personId)
    .eq("org_id", profile.org_id);
  revalidatePath("/people");
}

export async function setPersonRoles(personId: string, roleIds: string[]) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", personId)
    .eq("org_id", profile.org_id);

  const currentIds = new Set((current ?? []).map((r) => r.role_id));
  const nextIds = new Set(roleIds);

  const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    await supabase.from("user_roles").insert(
      toAdd.map((roleId) => ({
        org_id: profile.org_id,
        user_id: personId,
        role_id: roleId,
      }))
    );
  }

  if (toRemove.length > 0) {
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", personId)
      .in("role_id", toRemove);
  }

  revalidatePath("/people");
  revalidatePath("/roles");
}
