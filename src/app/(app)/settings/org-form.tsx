"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezoneSelect } from "@/components/shared/timezone-select";
import { updateOrganization } from "./actions";

export function OrgForm({
  defaultName,
  defaultTimezone,
}: {
  defaultName: string;
  defaultTimezone: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrganization,
    undefined
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="org-name">Church name</Label>
        <Input id="org-name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="org-timezone">Timezone</Label>
        <TimezoneSelect id="org-timezone" defaultValue={defaultTimezone} />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
