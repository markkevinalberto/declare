import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const { data: invites } = await supabase.rpc("get_org_invite", {
    p_token: token,
  });
  const invite = invites?.[0];

  if (!invite || invite.accepted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite not found</CardTitle>
          <CardDescription>
            This invite link is invalid or has already been used.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/signup?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  if (profile.org_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You&apos;re already part of a team</CardTitle>
          <CardDescription>
            Your account already belongs to an organization, so this invite
            can&apos;t be applied.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Join {invite.org_name}</CardTitle>
        <CardDescription>
          You&apos;ve been invited as a {invite.role}. Accept to join the
          team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteForm token={token} />
      </CardContent>
    </Card>
  );
}
