"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createPosition, getConflicts } from "./position-actions";

type Person = { id: string; name: string; email: string };
type Conflict = { conflict_type: string; detail: string | null };

const CONFLICT_LABEL: Record<string, string> = {
  blockout: "Unavailable",
  double_booked: "Already serving that day",
};

export function AddPersonPopover({
  serviceId,
  roleId,
  candidates,
  rowTrigger = false,
}: {
  serviceId: string;
  roleId: string;
  candidates: Person[];
  rowTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [conflicts, setConflicts] = useState<Record<string, Conflict[]>>({});
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && candidates.length > 0) {
      setLoading(true);
      Promise.all(
        candidates.map((c) => getConflicts(c.id, serviceId).then((res) => [c.id, res] as const))
      ).then((results) => {
        setConflicts(Object.fromEntries(results));
        setLoading(false);
      });
    }
  }

  function handleAdd(personId: string) {
    startTransition(async () => {
      await createPosition(serviceId, roleId, personId);
      setOpen(false);
      toast.success("Added as draft");
    });
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {rowTrigger ? (
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 border-t bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors first:border-t-0 hover:bg-muted hover:text-foreground"
            />
          }
        >
          <Plus className="size-4" /> Add Person
        </PopoverTrigger>
      ) : (
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>
          <Plus /> Add person
        </PopoverTrigger>
      )}
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>Add to this role</PopoverTitle>
        </PopoverHeader>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one holds this role yet — assign it on the Roles page first.
          </p>
        ) : (
          <ScrollArea className="h-56">
            <div className="grid gap-1 pr-2">
              {candidates.map((person) => {
                const personConflicts = conflicts[person.id] ?? [];
                return (
                  <button
                    key={person.id}
                    type="button"
                    disabled={pending}
                    onClick={() => handleAdd(person.id)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted disabled:opacity-50"
                  >
                    <UserRound className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{person.name}</span>
                      {!loading && personConflicts.length > 0 ? (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500"
                          )}
                        >
                          <AlertTriangle className="size-3" />
                          {personConflicts
                            .map((c) => CONFLICT_LABEL[c.conflict_type] ?? c.conflict_type)
                            .join(", ")}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
