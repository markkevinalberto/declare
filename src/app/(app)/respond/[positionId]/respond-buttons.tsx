"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { respondToPosition } from "./actions";

export function RespondButtons({
  positionId,
  status,
}: {
  positionId: string;
  status: "draft" | "invited" | "accepted" | "declined";
}) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function respond(action: "accept" | "decline") {
    startTransition(async () => {
      const result = await respondToPosition(positionId, action);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setCurrent(result.success);
        setError(null);
      }
    });
  }

  if (current === "draft") {
    return (
      <p className="text-sm text-muted-foreground">
        This invite is no longer pending.
      </p>
    );
  }

  if (current === "accepted") {
    return (
      <div className="grid gap-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-green-600">
          <Check className="size-4" /> You&apos;re confirmed. See you there!
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-fit border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-500 dark:hover:bg-red-950"
          disabled={pending}
          onClick={() => respond("decline")}
        >
          <X /> Change to decline
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (current === "declined") {
    return (
      <div className="grid gap-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <X className="size-4" /> You&apos;ve declined this invite.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-fit border-green-300 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-500 dark:hover:bg-green-950"
          disabled={pending}
          onClick={() => respond("accept")}
        >
          <Check /> Change to accept
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <Button
          className="flex-1 bg-green-600 text-white hover:bg-green-600/90"
          disabled={pending}
          onClick={() => respond("accept")}
        >
          <Check /> Accept
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={pending}
          onClick={() => respond("decline")}
        >
          <X /> Decline
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
