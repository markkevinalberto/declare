import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "./create-org-form";
import { JoinInviteCard } from "./join-invite-card";

export default async function OnboardingPage() {
  const profile = await requireProfile();
  if (profile.org_id) redirect("/dashboard");

  const supabase = await createClient();
  const { data: invites } = await supabase.rpc("get_my_pending_invites");
  const pendingInvites = invites ?? [];

  return (
    <div className="grid gap-4">
      {pendingInvites.length > 0 ? (
        <div className="grid gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              You&apos;ve been invited
            </h1>
            <p className="text-sm text-muted-foreground">
              A church has already invited {profile.email} — join with one
              click.
            </p>
          </div>
          {pendingInvites.map((invite) => (
            <JoinInviteCard
              key={invite.token}
              token={invite.token}
              orgName={invite.org_name}
              role={invite.role}
              createdAt={invite.created_at}
            />
          ))}
          <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or start something new
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {pendingInvites.length > 0 ? "Create a new church" : "Set up your church"}
          </CardTitle>
          <CardDescription>
            Create your organization to start planning services. You&apos;ll
            become the Admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>

      {pendingInvites.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Joining an existing church? Ask your church admin to send an invite
          to <span className="font-medium">{profile.email}</span>, then sign
          in again — it will appear here.
        </p>
      ) : null}
    </div>
  );
}
