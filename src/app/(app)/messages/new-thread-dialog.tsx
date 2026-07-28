"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatInOrgTime } from "@/lib/org-time";
import { createThread } from "./actions";

type Option = { id: string; label: string };

export function NewThreadDialog({
  groups,
  roles,
  services,
  timezone,
}: {
  groups: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  services: { id: string; title: string; starts_at: string }[];
  timezone: string;
}) {
  const [open, setOpen] = useState(false);
  const [scopeType, setScopeType] = useState<"role_group" | "role" | "service">("role_group");
  const [scopeId, setScopeId] = useState("");
  const [title, setTitle] = useState("");
  const [state, formAction, pending] = useActionState(createThread, undefined);

  const options: Option[] = useMemo(() => {
    if (scopeType === "role_group") return groups.map((g) => ({ id: g.id, label: g.name }));
    if (scopeType === "role") return roles.map((r) => ({ id: r.id, label: r.name }));
    return services.map((s) => ({
      id: s.id,
      label: `${s.title} — ${formatInOrgTime(s.starts_at, timezone, "MMM d, yyyy")}`,
    }));
  }, [scopeType, groups, roles, services, timezone]);

  function handleScopeIdChange(id: string) {
    setScopeId(id);
    const option = options.find((o) => o.id === id);
    if (option) setTitle(option.label);
  }

  function handleScopeTypeChange(next: string) {
    setScopeType(next as typeof scopeType);
    setScopeId("");
    setTitle("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setScopeType("role_group");
          setScopeId("");
          setTitle("");
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus /> New thread
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New message thread</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="thread-scope-type">Send to</Label>
            <Select
              name="scope_type"
              value={scopeType}
              onValueChange={(v) => v && handleScopeTypeChange(v)}
              items={{
                role_group: "A role group (whole team)",
                role: "A specific role",
                service: "Everyone serving at a service",
              }}
            >
              <SelectTrigger id="thread-scope-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="role_group">A role group (whole team)</SelectItem>
                <SelectItem value="role">A specific role</SelectItem>
                <SelectItem value="service">Everyone serving at a service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="thread-scope-id">
              {scopeType === "role_group" ? "Role group" : scopeType === "role" ? "Role" : "Service"}
            </Label>
            <Select
              name="scope_id"
              value={scopeId}
              onValueChange={(v) => v && handleScopeIdChange(v)}
              items={options.map((o) => ({ value: o.id, label: o.label }))}
            >
              <SelectTrigger id="thread-scope-id" className="w-full">
                <SelectValue placeholder="Choose one…" />
              </SelectTrigger>
              <SelectContent>
                {options.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Nothing available</div>
                ) : (
                  options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="thread-title">Thread title</Label>
            <Input
              id="thread-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending || !scopeId}>
              {pending ? "Creating…" : "Create thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
