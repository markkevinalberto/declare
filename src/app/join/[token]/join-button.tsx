"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { joinByToken, type JoinState } from "./actions";

export function JoinButton({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    async (prevState: JoinState, formData: FormData) =>
      joinByToken(prevState, formData),
    undefined
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Joining…" : "Join church"}
      </Button>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
