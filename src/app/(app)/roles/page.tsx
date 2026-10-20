import { requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { RoleGroupList } from "./role-group-list";
import { NewRoleGroupButton } from "./new-role-group-button";

export default async function RolesPage() {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const [{ data: groups }, { data: roles }, { data: userRoles }, { data: people }] =
    await Promise.all([
      supabase
        .from("role_groups")
        .select("id, name, sort_order")
        .eq("org_id", profile.org_id)
        .order("sort_order"),
      supabase
        .from("roles")
        .select("id, role_group_id, name, sort_order")
        .eq("org_id", profile.org_id)
        .order("sort_order"),
      supabase
        .from("user_roles")
        .select("user_id, role_id")
        .eq("org_id", profile.org_id),
      supabase
        .from("profiles")
        .select("id, name, email, active")
        .eq("org_id", profile.org_id)
        .eq("active", true)
        .order("name"),
    ]);

  const isAdmin = profile.role === "admin";

  return (
    <div className="grid gap-4">
      <PageHero
        title="Roles"
        description="Group roles under teams, like Worship Team → Vocals, Drums, Bass."
        mascot="/mascot/full/duo_headset.png"
        actions={isAdmin ? <NewRoleGroupButton /> : null}
      />

      <RoleGroupList
        groups={groups ?? []}
        roles={roles ?? []}
        userRoles={userRoles ?? []}
        people={people ?? []}
        isAdmin={isAdmin}
      />
    </div>
  );
}
