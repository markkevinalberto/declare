import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VALIDATED_USER_ID_HEADER } from "@/lib/supabase/proxy";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type OrgProfile = Profile & { org_id: string };

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // The middleware already validated the session for this exact request a
  // moment ago — trust its result instead of re-validating with a second
  // network round-trip to Supabase's Auth server on every single
  // navigation. Falls back to a direct check only if that header is
  // somehow missing (e.g. a request that didn't go through the
  // middleware). Either way, the query below is still fully RLS-protected.
  const headerList = await headers();
  let userId = headerList.get(VALIDATED_USER_ID_HEADER);
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
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
