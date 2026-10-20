import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { PageMascot } from "@/components/shared/page-mascot";
import { ProfileForm } from "./profile-form";
import { LeaveOrgDialog } from "./leave-org-dialog";

export default async function ProfileSettingsPage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.org_id)
    .single();

  return (
    <div className="grid max-w-md gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
        <PageMascot src="/mascot/mm_thumbsup.png" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultName={profile.name} defaultPhone={profile.phone ?? ""} />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Leave {org?.name ?? "this organization"} — your account stays
            active, just no longer part of this church.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveOrgDialog orgName={org?.name ?? "this organization"} />
        </CardContent>
      </Card>
    </div>
  );
}
