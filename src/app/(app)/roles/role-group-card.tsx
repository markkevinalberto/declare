"use client";

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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NameDialog } from "@/components/shared/name-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { cn } from "@/lib/utils";
import { createRole, deleteRoleGroup, reorderRoles, updateRoleGroup } from "./actions";
import { RoleRow } from "./role-row";

type RoleGroup = { id: string; name: string; sort_order: number };
type Role = { id: string; role_group_id: string; name: string; sort_order: number };
type UserRole = { user_id: string; role_id: string };
type Person = { id: string; name: string; email: string; active: boolean };

export function RoleGroupCard({
  group,
  roles,
  userRoles,
  people,
  isAdmin,
  onRolesReordered,
}: {
  group: RoleGroup;
  roles: Role[];
  userRoles: UserRole[];
  people: Person[];
  isAdmin: boolean;
  onRolesReordered: (groupId: string, orderedIds: string[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id, disabled: !isAdmin });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleRoleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = roles.findIndex((r) => r.id === active.id);
    const newIndex = roles.findIndex((r) => r.id === over.id);
    const nextIds = arrayMove(roles, oldIndex, newIndex).map((r) => r.id);
    onRolesReordered(group.id, nextIds);
    reorderRoles(nextIds);
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className={cn(isDragging && "z-10 opacity-80")}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex min-w-0 items-center gap-1">
          {isAdmin ? (
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder group"
              className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
            >
              <GripVertical className="size-4" />
            </button>
          ) : null}
          <CardTitle className="truncate text-base">{group.name}</CardTitle>
        </div>
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
        {roles.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">No roles in this group yet.</p>
        ) : (
          <DndContext
            id={`roles-${group.id}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRoleDragEnd}
          >
            <SortableContext items={roles.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              {roles.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  people={people}
                  memberIds={userRoles.filter((ur) => ur.role_id === role.id).map((ur) => ur.user_id)}
                  isAdmin={isAdmin}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        {isAdmin ? (
          <NameDialog
            triggerRender={<Button variant="ghost" size="sm" className="mt-1 justify-start" />}
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
}
