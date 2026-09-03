"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrgProfile } from "@/lib/auth/current-user";

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

const phoneSchema = z.object({
  // Permissive on formatting (spaces/dashes/parens/leading +) — just makes
  // sure something phone-shaped was actually typed, not a full E.164 check.
  phone: z
    .string()
    .min(1, "Enter your mobile number.")
    .refine(
      (v) => v.replace(/[^0-9]/g, "").length >= 7,
      "Enter a valid mobile number."
    ),
});

export async function setPhoneNumber(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const profile = await requireOrgProfile();
  const parsed = phoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ phone: parsed.data.phone.trim() })
    .eq("id", profile.id);
  if (error) return { error: error.message };

  redirect("/dashboard");
}
