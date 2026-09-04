"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBlockout, type BlockoutActionState } from "./actions";

type Blockout = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
};

export function EditBlockoutDialog({ blockout }: { blockout: Blockout }) {
  const [open, setOpen] = useState(false);
  const boundAction = updateBlockout.bind(null, blockout.id);
  const [state, formAction, pending] = useActionState(async (
    prevState: BlockoutActionState,
    formData: FormData
  ) => {
    const result = await boundAction(prevState, formData);
    if (!result?.error) {
      setOpen(false);
      toast.success("Blockout updated");
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Edit blockout" />}>
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit blockout</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`edit-blockout-start-${blockout.id}`}>Start date</Label>
              <Input
                id={`edit-blockout-start-${blockout.id}`}
                name="start_date"
                type="date"
                defaultValue={blockout.start_date}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-blockout-end-${blockout.id}`}>End date</Label>
              <Input
                id={`edit-blockout-end-${blockout.id}`}
                name="end_date"
                type="date"
                defaultValue={blockout.end_date}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`edit-blockout-reason-${blockout.id}`}>Reason (optional)</Label>
            <Input
              id={`edit-blockout-reason-${blockout.id}`}
              name="reason"
              defaultValue={blockout.reason ?? ""}
              placeholder="Vacation, travel, etc."
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
