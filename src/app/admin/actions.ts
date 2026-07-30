"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function adminDeleteUser(userId: string): Promise<{ error?: string }> {
  const profile = await requireSuperAdmin();
  if (userId === profile.id) {
    return { error: "You can't delete your own account from here." };
  }

  // Runs as the calling super admin (not the service-role client) so
  // current_profile_is_super_admin() inside the function sees the real
  // caller, and takes a per-org advisory lock for the whole check-then-
  // promote decision — deleting two admins of the same org back to back
  // can no longer race both requests into skipping promotion.
  const supabase = await createClient();
  const { error: promoteError } = await supabase.rpc(
    "admin_promote_sole_admin_replacement",
    { p_user_id: userId }
  );
  if (promoteError) return { error: promoteError.message };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return {};
}
