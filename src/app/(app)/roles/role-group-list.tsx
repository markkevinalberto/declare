"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { reorderRoleGroups } from "./actions";
import { RoleGroupCard } from "./role-group-card";

type RoleGroup = { id: string; name: string; sort_order: number };
type Role = { id: string; role_group_id: string; name: string; sort_order: number };
type UserRole = { user_id: string; role_id: string };
type Person = { id: string; name: string; email: string; active: boolean };

export function RoleGroupList({
  groups: initialGroups,
  roles: initialRoles,
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
  const [groups, setGroups] = useState(initialGroups);
  const [syncedGroups, setSyncedGroups] = useState(initialGroups);
  if (initialGroups !== syncedGroups) {
    setSyncedGroups(initialGroups);
    setGroups(initialGroups);
  }

  const [roles, setRoles] = useState(initialRoles);
  const [syncedRoles, setSyncedRoles] = useState(initialRoles);
  if (initialRoles !== syncedRoles) {
    setSyncedRoles(initialRoles);
    setRoles(initialRoles);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGroups((prev) => {
      const oldIndex = prev.findIndex((g) => g.id === active.id);
      const newIndex = prev.findIndex((g) => g.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      reorderRoleGroups(next.map((g) => g.id));
      return next;
    });
  }

  function handleRolesReordered(groupId: string, orderedIds: string[]) {
    setRoles((prev) => {
      const byId = new Map(prev.map((r) => [r.id, r]));
      const others = prev.filter((r) => r.role_group_id !== groupId);
      // sort_order has to be rewritten to match the new positions, not just
      // the array order — groupRoles below re-sorts by sort_order on every
      // render, so leaving the old values would immediately snap the drag
      // back to where it started.
      const reordered = orderedIds
        .map((id, index) => {
          const role = byId.get(id);
          return role ? { ...role, sort_order: index } : undefined;
        })
        .filter((r): r is Role => r !== undefined);
      return [...others, ...reordered];
    });
  }

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
    <DndContext
      id="role-groups"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleGroupDragEnd}
    >
      <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-4">
          {groups.map((group) => {
            const groupRoles = roles
              .filter((r) => r.role_group_id === group.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <RoleGroupCard
                key={group.id}
                group={group}
                roles={groupRoles}
                userRoles={userRoles}
                people={people}
                isAdmin={isAdmin}
                onRolesReordered={handleRolesReordered}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
