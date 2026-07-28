"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function adminDeleteUser(userId: string): Promise<{ error?: string }> {
  const profile = await requireSuperAdmin();
  if (userId === profile.id) {
    return { error: "You can't delete your own account from here." };
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("org_id, role")
    .eq("id", userId)
    .single();

  if (target?.org_id && target.role === "admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("org_id", target.org_id)
      .eq("role", "admin")
      .neq("id", userId);

    if ((count ?? 0) === 0) {
      // Sole admin of their org — promote the best remaining candidate first
      // (a leader if one exists, else the longest-standing active member),
      // mirroring leave_organization's logic, so the org isn't left with no
      // one able to manage it.
      const { data: candidates } = await admin
        .from("profiles")
        .select("id, role, created_at")
        .eq("org_id", target.org_id)
        .eq("active", true)
        .neq("id", userId);

      const promote = (candidates ?? []).sort((a, b) => {
        if ((a.role === "leader") !== (b.role === "leader")) {
          return a.role === "leader" ? -1 : 1;
        }
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      })[0];

      if (promote) {
        await admin.from("profiles").update({ role: "admin" }).eq("id", promote.id);
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return {};
}
