"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { leaveOrganization } from "./actions";

export function LeaveOrgDialog({ orgName }: { orgName: string }) {
  const [pending, startTransition] = useTransition();

  function handleLeave() {
    startTransition(async () => {
      const result = await leaveOrganization();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        <LogOut /> Leave organization
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {orgName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll be removed from this organization and sent back to the
            onboarding screen, where you can create or join another one. If
            you&apos;re the only admin, another member will be promoted to
            admin first so the organization isn&apos;t left unmanaged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={handleLeave}>
            {pending ? "Leaving…" : "Leave organization"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
