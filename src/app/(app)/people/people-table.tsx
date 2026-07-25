"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, SearchX, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { setPersonActive } from "./actions";
import { PersonEditDialog } from "./person-edit-dialog";

type Person = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "leader" | "member";
  active: boolean;
  avatar_url: string | null;
};
type UserRole = { user_id: string; role_id: string };
type Role = { id: string; name: string; role_group_id: string };
type RoleGroup = { id: string; name: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const PERMISSION_LABEL: Record<Person["role"], string> = {
  admin: "Admin",
  leader: "Leader",
  member: "Member",
};

export function PeopleTable({
  people,
  userRoles,
  roles,
  groups,
  isAdmin,
  currentUserId,
}: {
  people: Person[];
  userRoles: UserRole[];
  roles: Role[];
  groups: RoleGroup[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [, startTransition] = useTransition();

  function handleActiveChange(personId: string, checked: boolean) {
    startTransition(async () => {
      try {
        await setPersonActive(personId, checked);
      } catch {
        toast.error("Could not update. Please try again.");
      }
    });
  }

  const rolesByPerson = useMemo(() => {
    const map = new Map<string, Role[]>();
    for (const ur of userRoles) {
      const role = roles.find((r) => r.id === ur.role_id);
      if (!role) continue;
      const list = map.get(ur.user_id) ?? [];
      list.push(role);
      map.set(ur.user_id, list);
    }
    return map;
  }, [userRoles, roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((person) => {
      const matchesSearch =
        !q ||
        person.name.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q);
      const matchesRole =
        roleFilter === "all" ||
        (rolesByPerson.get(person.id) ?? []).some((r) => r.id === roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [people, search, roleFilter, rolesByPerson]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v ?? "all")}
          items={[{ value: "all", label: "All roles" }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead className="hidden lg:table-cell">Roles</TableHead>
              {isAdmin ? <TableHead className="w-24">Active</TableHead> : null}
              {isAdmin ? <TableHead className="w-16" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                    {people.length === 0 ? (
                      <>
                        <Users className="size-6" />
                        <p>No one has been added to this church yet.</p>
                      </>
                    ) : (
                      <>
                        <SearchX className="size-6" />
                        <p>No one matches your search.</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((person) => {
                const personRoles = rolesByPerson.get(person.id) ?? [];
                return (
                  <TableRow key={person.id} className={!person.active ? "opacity-50" : undefined}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          {person.avatar_url ? (
                            <AvatarImage src={person.avatar_url} alt={person.name} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {initials(person.name || person.email)}
                          </AvatarFallback>
                        </Avatar>
                        {person.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <div>{person.email}</div>
                      {person.phone ? <div>{person.phone}</div> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={person.role === "admin" ? "default" : "secondary"}>
                        {PERMISSION_LABEL[person.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {personRoles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          personRoles.map((r) => (
                            <Badge key={r.id} variant="outline">
                              {r.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    {isAdmin ? (
                      <TableCell>
                        <Switch
                          checked={person.active}
                          disabled={person.id === currentUserId}
                          onCheckedChange={(checked) =>
                            handleActiveChange(person.id, checked)
                          }
                        />
                      </TableCell>
                    ) : null}
                    {isAdmin ? (
                      <TableCell>
                        <PersonEditDialog
                          person={person}
                          roles={roles}
                          groups={groups}
                          personRoleIds={personRoles.map((r) => r.id)}
                          disablePermissionEdit={person.id === currentUserId}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
