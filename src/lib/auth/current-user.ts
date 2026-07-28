import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type OrgProfile = Profile & { org_id: string };

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireOrgProfile(): Promise<OrgProfile> {
  const profile = await requireProfile();
  if (!profile.org_id) redirect("/onboarding");
  return profile as OrgProfile;
}

export async function requireScheduler(): Promise<OrgProfile> {
  const profile = await requireOrgProfile();
  if (profile.role !== "admin" && profile.role !== "leader") {
    redirect("/dashboard");
  }
  return profile;
}

export async function requireAdmin(): Promise<OrgProfile> {
  const profile = await requireOrgProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.is_super_admin) redirect("/dashboard");
  return profile;
}
