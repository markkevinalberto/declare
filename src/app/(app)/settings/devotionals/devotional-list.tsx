"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDevotional,
  deleteDevotional,
  reorderDevotional,
  updateDevotional,
  type DevotionalInput,
} from "./actions";

export type DevotionalRow = {
  id: string;
  title: string;
  scripture_reference: string;
  scripture_text: string | null;
  reflection: string;
  sort_order: number;
};

const EMPTY_DRAFT: DevotionalInput = {
  title: "",
  scriptureReference: "",
  scriptureText: "",
  reflection: "",
};

function toDraft(row: DevotionalRow): DevotionalInput {
  return {
    title: row.title,
    scriptureReference: row.scripture_reference,
    scriptureText: row.scripture_text ?? "",
    reflection: row.reflection,
  };
}

// Mounted only while a devotional (or "new") is being edited — see the
// `key` on its call site below, which remounts it with a fresh draft
// whenever the target changes, instead of syncing state on every render.
function DevotionalDialog({
  editing,
  onOpenChange,
}: {
  editing: DevotionalRow | "new";
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<DevotionalInput>(
    editing === "new" ? EMPTY_DRAFT : toDraft(editing)
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result =
        editing === "new"
          ? await createDevotional(draft)
          : await updateDevotional(editing.id, draft);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success(editing === "new" ? "Devotional added" : "Devotional updated");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing === "new" ? "Add devotional" : "Edit devotional"}</DialogTitle>
          <DialogDescription>
            Sent by email as-is, and as a shorter text message to anyone with a
            mobile number on file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="devotional-title">Title</Label>
            <Input
              id="devotional-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Peace That Guards Your Heart"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="devotional-reference">Scripture reference</Label>
            <Input
              id="devotional-reference"
              value={draft.scriptureReference}
              onChange={(e) => setDraft((d) => ({ ...d, scriptureReference: e.target.value }))}
              placeholder="Philippians 4:6-7"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="devotional-text">Scripture text (optional)</Label>
            <Textarea
              id="devotional-text"
              rows={3}
              value={draft.scriptureText}
              onChange={(e) => setDraft((d) => ({ ...d, scriptureText: e.target.value }))}
              placeholder="Do not be anxious about anything…"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="devotional-reflection">Reflection</Label>
            <Textarea
              id="devotional-reflection"
              rows={6}
              value={draft.reflection}
              onChange={(e) => setDraft((d) => ({ ...d, reflection: e.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DevotionalList({ rows }: { rows: DevotionalRow[] }) {
  const [editing, setEditing] = useState<DevotionalRow | "new" | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleReorder(id: string, direction: "up" | "down") {
    setPendingId(id);
    startTransition(async () => {
      await reorderDevotional(id, direction);
      setPendingId(null);
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setPendingId(id);
    startTransition(async () => {
      await deleteDevotional(id);
      setPendingId(null);
    });
  }

  return (
    <div className="grid gap-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No devotionals yet — add at least one to turn on the weekly send.
        </p>
      ) : (
        <div className="grid gap-2">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.scripture_reference}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === 0 || pendingId === row.id}
                  onClick={() => handleReorder(row.id, "up")}
                  aria-label={`Move ${row.title} up`}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === rows.length - 1 || pendingId === row.id}
                  onClick={() => handleReorder(row.id, "down")}
                  aria-label={`Move ${row.title} down`}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditing(row)}
                  aria-label={`Edit ${row.title}`}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={pendingId === row.id}
                  onClick={() => handleDelete(row.id, row.title)}
                  aria-label={`Delete ${row.title}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div>
        <Button variant="outline" onClick={() => setEditing("new")}>
          <Plus /> Add devotional
        </Button>
      </div>
      {editing ? (
        <DevotionalDialog
          key={editing === "new" ? "new" : editing.id}
          editing={editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </div>
  );
}
