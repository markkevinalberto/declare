"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezoneSelect } from "@/components/shared/timezone-select";
import { createOrganization } from "./actions";

export function CreateOrgForm() {
  const [state, formAction, pending] = useActionState(
    createOrganization,
    undefined
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Church name</Label>
        <Input id="name" name="name" placeholder="Grace Community Church" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <TimezoneSelect id="timezone" defaultValue="Asia/Manila" />
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create church"}
      </Button>
    </form>
  );
}
