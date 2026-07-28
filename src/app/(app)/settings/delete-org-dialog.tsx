"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, TriangleAlert } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteOrganization } from "./actions";

const DELETED_ITEMS = [
  "Every service, its plan, and its full schedule history",
  "All songs, lyrics, and projection settings",
  "Roles, role groups, and volunteer assignments",
  "Invite and response history, plus your shareable join link",
  "Any custom bibles you've uploaded",
  "Everyone's blockout dates",
  "Message threads and notifications",
  "Uploaded projection media",
];

export function DeleteOrgDialog({ orgName }: { orgName: string }) {
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOrganization(confirmText);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) setConfirmText("");
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2 /> Delete organization
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-destructive" />
            Delete {orgName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the organization. There is no undo and
            no recovery — please read exactly what goes away before
            continuing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">
            This will permanently delete:
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-muted-foreground">
            {DELETED_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="font-medium">What happens to your people</p>
          <p className="mt-1 text-muted-foreground">
            Every member&apos;s account survives — they&apos;re just removed
            from this organization and sent to the onboarding screen, where
            they can create or join another one.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="confirm-org-name" className="text-xs">
            Type <span className="font-mono font-semibold">{orgName}</span>{" "}
            to confirm
          </Label>
          <Input
            id="confirm-org-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending || confirmText !== orgName}
            onClick={handleDelete}
          >
            {pending ? "Deleting…" : "Permanently delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
