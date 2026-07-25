"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, CircleHelp, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendAllInvites } from "./position-actions";
import { RoleScheduleRow } from "./role-schedule-row";

export type PositionRow = {
  id: string;
  role_id: string;
  user_id: string | null;
  status: "draft" | "invited" | "accepted" | "declined";
  invited_at: string | null;
  responded_at: string | null;
  profiles: { id: string; name: string; email: string; avatar_url: string | null } | null;
};

type RoleGroup = { id: string; name: string; sort_order: number };
type Role = { id: string; role_group_id: string; name: string; sort_order: number };
type UserRole = { user_id: string; role_id: string };
type Person = { id: string; name: string; email: string; active: boolean };

function countStatuses(positions: PositionRow[]) {
  return {
    accepted: positions.filter((p) => p.status === "accepted").length,
    declined: positions.filter((p) => p.status === "declined").length,
    pending: positions.filter((p) => p.status === "invited").length,
    draft: positions.filter((p) => p.status === "draft").length,
  };
}

function StatusCounts({
  counts,
  className,
}: {
  counts: ReturnType<typeof countStatuses>;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5 text-sm", className)}>
      {counts.accepted > 0 ? (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
          <CheckCircle2 className="size-4" /> {counts.accepted}
        </span>
      ) : null}
      {counts.declined > 0 ? (
        <span className="flex items-center gap-1 text-red-600 dark:text-red-500">
          <XCircle className="size-4" /> {counts.declined}
        </span>
      ) : null}
      {counts.pending > 0 ? (
        <span className="flex items-center gap-1 text-muted-foreground">
          <CircleHelp className="size-4" /> {counts.pending}
        </span>
      ) : null}
    </span>
  );
}

export function PeopleTab({
  serviceId,
  groups,
  roles,
  positions,
  userRoles,
  people,
  isScheduler,
  currentUserId,
}: {
  serviceId: string;
  groups: RoleGroup[];
  roles: Role[];
  positions: PositionRow[];
  userRoles: UserRole[];
  people: Person[];
  isScheduler: boolean;
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();

  const groupsWithData = useMemo(() => {
    return groups
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((group) => {
        const groupRoles = roles
          .filter((r) => r.role_group_id === group.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const roleIds = new Set(groupRoles.map((r) => r.id));
        const groupPositions = positions.filter((p) => roleIds.has(p.role_id));
        return { group, roles: groupRoles, counts: countStatuses(groupPositions) };
      })
      .filter((g) => g.roles.length > 0);
  }, [groups, roles, positions]);

  const defaultGroupId =
    groupsWithData.find((g) =>
      g.counts.accepted + g.counts.declined + g.counts.pending + g.counts.draft > 0
    )?.group.id ?? groupsWithData[0]?.group.id;
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const activeGroupId = selectedGroupId ?? defaultGroupId;
  const activeGroup = groupsWithData.find((g) => g.group.id === activeGroupId);

  const totalCounts = countStatuses(positions);
  const draftCount = totalCounts.draft;

  function handleSendAll() {
    startTransition(async () => {
      await sendAllInvites(serviceId);
      toast.success("Invites sent");
    });
  }

  if (groupsWithData.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        No roles set up yet. Create role groups and roles on the Roles page
        before scheduling people.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusCounts counts={totalCounts} />
        {isScheduler ? (
          <Button onClick={handleSendAll} disabled={pending || draftCount === 0}>
            <Send /> Send Invites{draftCount > 0 ? ` (${draftCount})` : " (0)"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-[230px_1fr]">
        <div className="grid content-start gap-1.5">
          <p className="text-sm font-semibold">Teams</p>
          {groupsWithData.map(({ group, counts }) => {
            const active = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "border-primary/25 bg-accent text-accent-foreground"
                    : "border-transparent hover:bg-muted"
                )}
              >
                <span className="truncate">{group.name}</span>
                <StatusCounts counts={counts} className="gap-1.5 text-xs [&_svg]:size-3.5" />
              </button>
            );
          })}
        </div>

        <div className="grid content-start gap-4">
          <p className="text-sm font-semibold">Roles</p>
          {activeGroup?.roles.map((role) => {
            const rolePositions = positions.filter((p) => p.role_id === role.id);
            const candidates = people.filter((person) =>
              userRoles.some((ur) => ur.role_id === role.id && ur.user_id === person.id)
            );
            const iHoldThisRole = userRoles.some(
              (ur) => ur.role_id === role.id && ur.user_id === currentUserId
            );
            return (
              <RoleScheduleRow
                key={role.id}
                serviceId={serviceId}
                roleId={role.id}
                roleName={role.name}
                positions={rolePositions}
                candidates={candidates}
                isScheduler={isScheduler}
                currentUserId={currentUserId}
                canSelfSignUp={iHoldThisRole}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
