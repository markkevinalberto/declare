"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvite } from "./actions";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(createInvite, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="grid gap-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="volunteer@email.com"
          required
          className="w-64"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          name="role"
          defaultValue="member"
          items={{ admin: "Admin", leader: "Leader", member: "Member" }}
        >
          <SelectTrigger id="invite-role" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="leader">Leader</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send invite"}
      </Button>
      {state?.error ? (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="w-full text-sm text-green-600">{state.success}</p>
      ) : null}
    </form>
  );
}
