"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { updatePerson, setPersonPermissionLevel, setPersonRoles } from "./actions";

type Person = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "leader" | "member";
  active: boolean;
};
type Role = { id: string; name: string; role_group_id: string };
type RoleGroup = { id: string; name: string };

export function PersonEditDialog({
  person,
  roles,
  groups,
  personRoleIds,
  disablePermissionEdit,
}: {
  person: Person;
  roles: Role[];
  groups: RoleGroup[];
  personRoleIds: string[];
  disablePermissionEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(person.name);
  const [phone, setPhone] = useState(person.phone ?? "");
  const [permission, setPermission] = useState(person.role);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
    new Set(personRoleIds)
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(person.name);
      setPhone(person.phone ?? "");
      setPermission(person.role);
      setSelectedRoles(new Set(personRoleIds));
      setError(undefined);
    }
    setOpen(next);
  }

  function toggleRole(id: string, checked: boolean) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("phone", phone);
      const result = await updatePerson(person.id, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (!disablePermissionEdit && permission !== person.role) {
        await setPersonPermissionLevel(person.id, permission);
      }
      await setPersonRoles(person.id, [...selectedRoles]);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Edit ${person.name || person.email}`} />}>
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {person.name}</DialogTitle>
          <DialogDescription>{person.email}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-person-name">Name</Label>
            <Input
              id="edit-person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-person-phone">Phone</Label>
            <Input
              id="edit-person-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-person-permission">Permission level</Label>
            <Select
              value={permission}
              onValueChange={(v) => setPermission(v as Person["role"])}
              disabled={disablePermissionEdit}
              items={{ admin: "Admin", leader: "Leader", member: "Member" }}
            >
              <SelectTrigger id="edit-person-permission" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            {disablePermissionEdit ? (
              <p className="text-xs text-muted-foreground">
                You can&apos;t change your own permission level.
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label>Roles</Label>
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="grid gap-3">
                {groups.map((group) => {
                  const groupRoles = roles.filter(
                    (r) => r.role_group_id === group.id
                  );
                  if (groupRoles.length === 0) return null;
                  return (
                    <div key={group.id} className="grid gap-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {group.name}
                      </p>
                      {groupRoles.map((role) => (
                        <Label
                          key={role.id}
                          className="flex items-center gap-2.5 rounded-md px-1.5 py-1 font-normal hover:bg-muted"
                        >
                          <Checkbox
                            checked={selectedRoles.has(role.id)}
                            onCheckedChange={(checked) =>
                              toggleRole(role.id, checked)
                            }
                          />
                          <span className="text-sm">{role.name}</span>
                        </Label>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
