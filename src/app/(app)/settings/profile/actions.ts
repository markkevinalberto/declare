"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = { error?: string; success?: string } | undefined;

const profileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().optional(),
});

export async function updateOwnProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const profile = await requireOrgProfile();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ name: parsed.data.name, phone: parsed.data.phone ?? null })
    .eq("id", profile.id);
  if (error) return { error: error.message };

  revalidatePath("/settings/profile");
  return { success: "Profile updated." };
}

export async function leaveOrganization(): Promise<ProfileActionState> {
  await requireOrgProfile();
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_organization");
  if (error) return { error: error.message };
  redirect("/onboarding");
}
