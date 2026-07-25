"use client";

import { useActionState } from "react";
import { formatDistanceToNow } from "date-fns";
import { DeclareMark } from "@/components/brand/declare-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { acceptInvite, type OnboardingState } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  leader: "Leader",
  member: "Member",
};

export function JoinInviteCard({
  token,
  orgName,
  role,
  createdAt,
}: {
  token: string;
  orgName: string;
  role: string;
  createdAt: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (prevState: OnboardingState, formData: FormData) =>
      acceptInvite(prevState, formData),
    undefined
  );

  return (
    <Card className="border-primary/30">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2">
            <DeclareMark className="size-5 text-primary-foreground" />
          </span>
          <div>
            <p className="font-medium">{orgName}</p>
            <p className="text-sm text-muted-foreground">
              Invited as {ROLE_LABEL[role] ?? role} ·{" "}
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <form action={formAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" disabled={pending}>
            {pending ? "Joining…" : "Join church"}
          </Button>
        </form>
        {state?.error ? (
          <p className="w-full text-sm text-destructive">{state.error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
