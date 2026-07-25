import Link from "next/link";
import { DeclareMark } from "@/components/brand/declare-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { JoinButton } from "./join-button";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: orgs } = await supabase.rpc("get_org_by_join_token", {
    p_token: token,
  });
  const org = orgs?.[0];

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/30">
            <DeclareMark className="size-6 text-primary-foreground" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Declare</span>
        </div>
        {children}
      </div>
    </div>
  );

  if (!org) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invalid invite link</CardTitle>
          <CardDescription>
            This link is invalid or has been reset by the church admin. Ask
            them for a fresh link.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const profile = await getCurrentProfile();
  const joinPath = `/join/${token}`;

  if (!profile) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            You&apos;re invited to {org.org_name}
          </CardTitle>
          <CardDescription>
            Create an account (or sign in) to join and start serving.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button
            nativeButton={false}
            className="w-full"
            render={<Link href={`/signup?next=${encodeURIComponent(joinPath)}`} />}
          >
            Sign up to join
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            className="w-full"
            render={<Link href={`/login?next=${encodeURIComponent(joinPath)}`} />}
          >
            I already have an account
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (profile.org_id) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Already in a church</CardTitle>
          <CardDescription>
            You already belong to an organization, so this invite link
            can&apos;t be used with this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            variant="outline"
            className="w-full"
            render={<Link href="/dashboard" />}
          >
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return shell(
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Join {org.org_name}</CardTitle>
        <CardDescription>
          You&apos;ll join as a Member — a leader can adjust your permissions
          later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <JoinButton token={token} />
      </CardContent>
    </Card>
  );
}
