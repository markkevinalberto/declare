"use client";

import { Layers, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NameDialog } from "@/components/shared/name-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import {
  createRole,
  deleteRole,
  deleteRoleGroup,
  updateRole,
  updateRoleGroup,
} from "./actions";
import { RolePeopleDialog } from "./role-people-dialog";

type RoleGroup = { id: string; name: string; sort_order: number };
type Role = { id: string; role_group_id: string; name: string; sort_order: number };
type UserRole = { user_id: string; role_id: string };
type Person = { id: string; name: string; email: string; active: boolean };

export function RoleGroupList({
  groups,
  roles,
  userRoles,
  people,
  isAdmin,
}: {
  groups: RoleGroup[];
  roles: Role[];
  userRoles: UserRole[];
  people: Person[];
  isAdmin: boolean;
}) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <Layers className="size-6" />
          <p className="font-medium text-foreground">No role groups yet</p>
          <p>
            {isAdmin
              ? "Create your first role group, like “Worship Team” or “Tech Team”, to start organizing roles."
              : "An admin hasn't set up any role groups yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => {
        const groupRoles = roles
          .filter((r) => r.role_group_id === group.id)
          .sort((a, b) => a.sort_order - b.sort_order);

        return (
          <Card key={group.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{group.name}</CardTitle>
              {isAdmin ? (
                <div className="flex items-center gap-1">
                  <NameDialog
                    triggerRender={<Button variant="ghost" size="icon-sm" />}
                    triggerContent={<Pencil />}
                    title="Rename role group"
                    label="Group name"
                    defaultValue={group.name}
                    action={updateRoleGroup.bind(null, group.id)}
                  />
                  <ConfirmDeleteButton
                    action={deleteRoleGroup.bind(null, group.id)}
                    title={`Delete ${group.name}?`}
                    description="This also deletes every role inside this group, and unassigns anyone holding them. This can't be undone."
                  />
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-1">
              {groupRoles.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  No roles in this group yet.
                </p>
              ) : (
                groupRoles.map((role) => {
                  const memberIds = userRoles
                    .filter((ur) => ur.role_id === role.id)
                    .map((ur) => ur.user_id);
                  return (
                    <div
                      key={role.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50"
                    >
                      <span className="text-sm">{role.name}</span>
                      <div className="flex items-center gap-1">
                        <RolePeopleDialog
                          roleId={role.id}
                          roleName={role.name}
                          people={people}
                          memberIds={memberIds}
                        />
                        {isAdmin ? (
                          <>
                            <NameDialog
                              triggerRender={
                                <Button variant="ghost" size="icon-sm" />
                              }
                              triggerContent={<Pencil />}
                              title="Rename role"
                              label="Role name"
                              defaultValue={role.name}
                              action={updateRole.bind(null, role.id)}
                            />
                            <ConfirmDeleteButton
                              action={deleteRole.bind(null, role.id)}
                              title={`Delete ${role.name}?`}
                              description="Anyone currently holding this role will be unassigned. This can't be undone."
                            />
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
              {isAdmin ? (
                <NameDialog
                  triggerRender={
                    <Button variant="ghost" size="sm" className="mt-1 justify-start" />
                  }
                  triggerContent={
                    <>
                      <Plus /> Add role
                    </>
                  }
                  title={`New role in ${group.name}`}
                  label="Role name"
                  action={createRole.bind(null, group.id)}
                  submitLabel="Create role"
                />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
