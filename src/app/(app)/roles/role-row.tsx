"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NameDialog } from "@/components/shared/name-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { cn } from "@/lib/utils";
import { deleteRole, updateRole } from "./actions";
import { RolePeopleDialog } from "./role-people-dialog";

type Role = { id: string; role_group_id: string; name: string; sort_order: number };
type Person = { id: string; name: string; email: string; active: boolean };

export function RoleRow({
  role,
  people,
  memberIds,
  isAdmin,
}: {
  role: Role;
  people: Person[];
  memberIds: string[];
  isAdmin: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: role.id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50",
        isDragging && "z-10 bg-muted opacity-80"
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        {isAdmin ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder role"
            className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
        <span className="truncate text-sm">{role.name}</span>
      </div>
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
              triggerRender={<Button variant="ghost" size="icon-sm" />}
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
}
