"use client";

import { useActionState, useState } from "react";
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

type NameActionState = { error?: string } | undefined;

export function NameDialog({
  triggerRender,
  triggerContent,
  title,
  description,
  label,
  defaultValue = "",
  action,
  submitLabel = "Save",
}: {
  triggerRender: React.ReactElement;
  triggerContent: React.ReactNode;
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  action: (
    prevState: NameActionState,
    formData: FormData
  ) => Promise<NameActionState>;
  submitLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prevState: NameActionState,
    formData: FormData
  ) => {
    const result = await action(prevState, formData);
    if (!result?.error) setOpen(false);
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender}>{triggerContent}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name-dialog-input">{label}</Label>
            <Input
              id="name-dialog-input"
              name="name"
              defaultValue={defaultValue}
              autoFocus
              required
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
