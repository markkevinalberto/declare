import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { OrgForm } from "./org-form";
import { InviteForm } from "./invite-form";
import { InvitesList } from "./invites-list";
import { JoinLinkCard } from "./join-link-card";
import { DeleteOrgDialog } from "./delete-org-dialog";

export default async function SettingsPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: org }, { data: invites }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, timezone, join_token")
      .eq("id", profile.org_id)
      .single(),
    supabase
      .from("org_invites")
      .select("id, email, role, created_at, accepted_at")
      .eq("org_id", profile.org_id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Organization settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Church details</CardTitle>
          <CardDescription>
            Shown throughout Declare and in emails to your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgForm
            defaultName={org?.name ?? ""}
            defaultTimezone={org?.timezone ?? "America/New_York"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shareable invite link</CardTitle>
          <CardDescription>
            Share this link in a group chat or bulletin — anyone with it can
            sign up and join your church as a Member, no email invite needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinLinkCard token={org?.join_token ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite people</CardTitle>
          <CardDescription>
            Send an email invite with an assigned permission level. They&apos;ll
            join your organization once they accept.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <InviteForm />
          <InvitesList invites={invites ?? []} />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Permanently delete {org?.name ?? "this organization"} and
            everything in it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteOrgDialog orgName={org?.name ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
