"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBlockout, type BlockoutActionState } from "./actions";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function NewBlockoutForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prevState: BlockoutActionState,
    formData: FormData
  ) => {
    const result = await createBlockout(prevState, formData);
    if (!result?.error) {
      formRef.current?.reset();
      toast.success("Blockout added");
    }
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="blockout-start">Start date</Label>
          <Input id="blockout-start" name="start_date" type="date" defaultValue={today()} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="blockout-end">End date</Label>
          <Input id="blockout-end" name="end_date" type="date" defaultValue={today()} required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="blockout-reason">Reason (optional)</Label>
        <Input id="blockout-reason" name="reason" placeholder="Vacation, travel, etc." />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add blockout"}
        </Button>
      </div>
    </form>
  );
}
