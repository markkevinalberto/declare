"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createService, type ServiceActionState } from "./actions";

function nextSunday() {
  const d = new Date();
  const diff = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function NewServiceButton() {
  const [open, setOpen] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prevState: ServiceActionState,
    formData: FormData
  ) => {
    const result = await createService(prevState, formData);
    if (!result?.error) setOpen(false);
    return result;
  }, undefined);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRecurring(false);
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus /> New service
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New service</DialogTitle>
          <DialogDescription>
            Create a single service, or a recurring series.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="service-title">Title</Label>
            <Input
              id="service-title"
              name="title"
              defaultValue="Sunday Worship"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="service-date">Date</Label>
              <Input
                id="service-date"
                name="date"
                type="date"
                defaultValue={nextSunday()}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-time">Time</Label>
              <Input
                id="service-time"
                name="time"
                type="time"
                defaultValue="09:00"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-campus">Campus / location</Label>
            <Input id="service-campus" name="campus" placeholder="Main Campus" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-notes">Notes</Label>
            <Textarea id="service-notes" name="notes" rows={2} />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <Label htmlFor="service-recurring">Recurring series</Label>
              <p className="text-xs text-muted-foreground">
                Create multiple future occurrences at once.
              </p>
            </div>
            <Switch
              id="service-recurring"
              checked={recurring}
              onCheckedChange={setRecurring}
            />
            <input type="hidden" name="recurring" value={recurring ? "yes" : "no"} />
          </div>

          {recurring ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="service-frequency">Frequency</Label>
                <Select
                  name="frequency"
                  defaultValue="weekly"
                  items={{ weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly" }}
                >
                  <SelectTrigger id="service-frequency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-occurrences">Occurrences</Label>
                <Input
                  id="service-occurrences"
                  name="occurrences"
                  type="number"
                  min={1}
                  max={52}
                  defaultValue={8}
                />
              </div>
            </div>
          ) : null}

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
