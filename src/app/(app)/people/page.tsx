import { requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { PeopleTable } from "./people-table";
import { InvitePersonDialog } from "./invite-person-dialog";
import { PendingInvites } from "./pending-invites";

export default async function PeoplePage() {
  const profile = await requireScheduler();
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  const [
    { data: people },
    { data: userRoles },
    { data: roles },
    { data: groups },
    { data: invites },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, phone, role, active, avatar_url")
      .eq("org_id", profile.org_id)
      .order("name"),
    supabase
      .from("user_roles")
      .select("user_id, role_id")
      .eq("org_id", profile.org_id),
    supabase
      .from("roles")
      .select("id, name, role_group_id")
      .eq("org_id", profile.org_id)
      .order("sort_order"),
    supabase
      .from("role_groups")
      .select("id, name")
      .eq("org_id", profile.org_id)
      .order("sort_order"),
    isAdmin
      ? supabase
          .from("org_invites")
          .select("id, email, role, created_at")
          .eq("org_id", profile.org_id)
          .is("accepted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; email: string; role: string; created_at: string }[] }),
  ]);

  return (
    <div className="grid gap-4">
      <PageHero
        title="People"
        description="Everyone in your organization and the roles they hold."
        mascot="/mascot/full/duo_thumbs_peace.png"
        actions={isAdmin ? <InvitePersonDialog /> : null}
      />

      {isAdmin && invites && invites.length > 0 ? (
        <PendingInvites invites={invites} />
      ) : null}

      <PeopleTable
        people={people ?? []}
        userRoles={userRoles ?? []}
        roles={roles ?? []}
        groups={groups ?? []}
        isAdmin={isAdmin}
        currentUserId={profile.id}
      />
    </div>
  );
}
