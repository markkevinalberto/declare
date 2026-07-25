"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvite, type SettingsActionState } from "@/app/(app)/settings/actions";

export function InvitePersonDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prevState: SettingsActionState,
    formData: FormData
  ) => {
    const result = await createInvite(prevState, formData);
    if (result?.success) {
      setOpen(false);
      toast.success(result.success);
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus /> Invite person
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite someone to your church</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link to join and set up their
            account.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-dialog-email">Email</Label>
            <Input
              id="invite-dialog-email"
              name="email"
              type="email"
              placeholder="volunteer@email.com"
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-dialog-role">Permission level</Label>
            <Select
              name="role"
              defaultValue="member"
              items={{ admin: "Admin", leader: "Leader", member: "Member" }}
            >
              <SelectTrigger id="invite-dialog-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
