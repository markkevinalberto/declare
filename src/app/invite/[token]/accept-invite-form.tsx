"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/app/onboarding/actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvite, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Joining…" : "Accept invite"}
      </Button>
    </form>
  );
}
