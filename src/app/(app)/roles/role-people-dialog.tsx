"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { setRoleMembers } from "./actions";

type Person = { id: string; name: string; email: string };

export function RolePeopleDialog({
  roleId,
  roleName,
  people,
  memberIds,
}: {
  roleId: string;
  roleName: string;
  people: Person[];
  memberIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(memberIds));
  const [pending, startTransition] = useTransition();

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleOpenChange(next: boolean) {
    if (next) setSelected(new Set(memberIds));
    setOpen(next);
  }

  function handleSave() {
    startTransition(async () => {
      await setRoleMembers(roleId, [...selected]);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Users /> {memberIds.length}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>People in {roleName}</DialogTitle>
          <DialogDescription>
            Check everyone who should hold this role. Changes apply when you
            save.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 pr-3">
          <div className="grid gap-1">
            {people.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active people yet.
              </p>
            ) : (
              people.map((person) => (
                <Label
                  key={person.id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 font-normal hover:bg-muted"
                >
                  <Checkbox
                    checked={selected.has(person.id)}
                    onCheckedChange={(checked) => toggle(person.id, checked)}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm">{person.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {person.email}
                    </span>
                  </span>
                </Label>
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
