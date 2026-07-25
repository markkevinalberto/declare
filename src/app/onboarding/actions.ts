"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string } | undefined;

const createOrgSchema = z.object({
  name: z.string().min(2, "Church name must be at least 2 characters."),
  timezone: z.string().min(1, "Timezone is required."),
});

export async function createOrganization(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_timezone: parsed.data.timezone,
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function acceptInvite(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Missing invite token." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_org_invite", {
    p_token: token,
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
