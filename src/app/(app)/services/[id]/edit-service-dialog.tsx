"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateService, type ServiceActionState } from "../actions";

type Service = {
  id: string;
  title: string;
  starts_at: string;
  campus: string | null;
  notes: string | null;
};

export function EditServiceDialog({
  service,
  open,
  onOpenChange,
}: {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const boundAction = updateService.bind(null, service.id);
  const [state, formAction, pending] = useActionState(async (
    prevState: ServiceActionState,
    formData: FormData
  ) => {
    const result = await boundAction(prevState, formData);
    if (!result?.error) onOpenChange(false);
    return result;
  }, undefined);

  const startsAt = new Date(service.starts_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit service</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-service-title">Title</Label>
            <Input id="edit-service-title" name="title" defaultValue={service.title} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-service-date">Date</Label>
              <Input
                id="edit-service-date"
                name="date"
                type="date"
                defaultValue={format(startsAt, "yyyy-MM-dd")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-service-time">Time</Label>
              <Input
                id="edit-service-time"
                name="time"
                type="time"
                defaultValue={format(startsAt, "HH:mm")}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-service-campus">Campus / location</Label>
            <Input id="edit-service-campus" name="campus" defaultValue={service.campus ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-service-notes">Notes</Label>
            <Textarea id="edit-service-notes" name="notes" rows={2} defaultValue={service.notes ?? ""} />
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
