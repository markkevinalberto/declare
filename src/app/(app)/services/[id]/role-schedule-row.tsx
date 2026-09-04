"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, CircleHelp, Minus, Send, Trash2, UserPlus, X } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { respondToPosition } from "@/app/(app)/respond/[positionId]/actions";
import { AddPersonPopover } from "./add-person-popover";
import { deletePosition, sendInvite } from "./position-actions";
import { selfSignUpForRole } from "./self-signup-actions";
import type { PositionRow } from "./people-tab";

type Person = { id: string; name: string; email: string; active: boolean };

const STATUS_LABEL: Record<PositionRow["status"], string> = {
  draft: "Draft — not yet invited",
  invited: "Invited — no response yet",
  accepted: "Accepted",
  declined: "Declined",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusAvatar({ position }: { position: PositionRow }) {
  const name =
    position.profiles?.name || position.profiles?.email || "Unknown";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Avatar className="size-9">
            {position.profiles?.avatar_url ? (
              <AvatarImage src={position.profiles.avatar_url} alt={name} />
            ) : null}
            <AvatarFallback className="text-xs">
              {initials(name) || "?"}
            </AvatarFallback>
            <AvatarBadge
              className={cn(
                "size-4 [&>svg]:size-3",
                position.status === "accepted" && "bg-green-500 text-white",
                position.status === "declined" && "bg-red-500 text-white",
                position.status === "invited" && "bg-zinc-400 text-white",
                position.status === "draft" && "bg-muted-foreground/50 text-white"
              )}
            >
              {position.status === "accepted" ? <Check /> : null}
              {position.status === "declined" ? <X /> : null}
              {position.status === "invited" ? <CircleHelp /> : null}
              {position.status === "draft" ? <Minus /> : null}
            </AvatarBadge>
          </Avatar>
        }
      />
      <TooltipContent>{STATUS_LABEL[position.status]}</TooltipContent>
    </Tooltip>
  );
}

export function RoleScheduleRow({
  serviceId,
  roleId,
  roleName,
  positions,
  candidates,
  isScheduler,
  currentUserId,
  canSelfSignUp = false,
}: {
  serviceId: string;
  roleId: string;
  roleName: string;
  positions: PositionRow[];
  candidates: Person[];
  isScheduler: boolean;
  currentUserId: string;
  canSelfSignUp?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(positions.map((p) => p.user_id).filter(Boolean));
  // Self-assignment goes through the dedicated "Sign up" flow below (instant
  // accept, no draft/invite step) — exclude yourself here so there's only
  // one path to picking your own role.
  const availableCandidates = candidates.filter(
    (c) => !assignedIds.has(c.id) && c.id !== currentUserId
  );
  const alreadyMine = positions.some((p) => p.user_id === currentUserId);
  // Self sign-up (instant accept, no invite step) is a scheduler perk —
  // regular members still go through the normal invite -> accept flow.
  const showSelfSignUp = isScheduler && canSelfSignUp && !alreadyMine;

  function handleSelfSignUp() {
    startTransition(async () => {
      const result = await selfSignUpForRole(serviceId, roleId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`You're signed up for ${roleName}`);
      if (result?.warning) toast.warning(result.warning);
    });
  }

  function handleSend(positionId: string, kind: "send" | "resend") {
    startTransition(async () => {
      await sendInvite(positionId, serviceId);
      toast.success(kind === "resend" ? "Invite resent" : "Invite sent");
    });
  }

  function handleDelete(positionId: string) {
    startTransition(async () => {
      await deletePosition(positionId, serviceId);
    });
  }

  function handleRespond(positionId: string, action: "accept" | "decline") {
    startTransition(async () => {
      const result = await respondToPosition(positionId, action);
      if (result?.error) toast.error(result.error);
      else if (action === "accept") toast.success("You're confirmed. See you there!");
      else toast.success("You've declined this invite.");
    });
  }

  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">{roleName}</p>
      <div className="overflow-hidden rounded-lg border bg-card">
        {positions.length === 0 && !isScheduler && !showSelfSignUp ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">
            No one scheduled yet.
          </p>
        ) : null}

        {positions.map((position) => {
          const mine = position.user_id === currentUserId;
          const canRespond = mine && position.status !== "draft";
          const invited = position.status === "invited";
          return (
            <div
              key={position.id}
              className="flex items-center justify-between gap-2 border-b px-3 py-2 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <StatusAvatar position={position} />
                <span className="truncate text-sm">
                  {position.profiles?.name ?? position.profiles?.email ?? "Unknown"}
                  {mine ? (
                    <span className="text-muted-foreground"> (you)</span>
                  ) : null}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {canRespond && position.status !== "accepted" ? (
                  <Button
                    size="sm"
                    variant={invited ? undefined : "outline"}
                    className={
                      invited
                        ? "bg-green-600 text-white shadow-none hover:bg-green-600/90"
                        : "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-500 dark:hover:bg-green-950"
                    }
                    disabled={pending}
                    onClick={() => handleRespond(position.id, "accept")}
                  >
                    <Check /> Accept
                  </Button>
                ) : null}
                {canRespond && position.status !== "declined" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-500 dark:hover:bg-red-950"
                    disabled={pending}
                    onClick={() => handleRespond(position.id, "decline")}
                  >
                    <X /> Decline
                  </Button>
                ) : null}
                {isScheduler && position.status === "draft" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleSend(position.id, "send")}
                  >
                    <Send /> Send now
                  </Button>
                ) : null}
                {isScheduler && position.status === "invited" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    title="They haven't responded yet — send the invite email again"
                    onClick={() => handleSend(position.id, "resend")}
                  >
                    <Send /> Resend
                  </Button>
                ) : null}
                {isScheduler ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() => handleDelete(position.id)}
                    aria-label={`Remove ${position.profiles?.name ?? position.profiles?.email ?? "this person"}`}
                  >
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}

        {isScheduler ? (
          <AddPersonPopover
            serviceId={serviceId}
            roleId={roleId}
            candidates={availableCandidates}
            rowTrigger
          />
        ) : null}

        {showSelfSignUp ? (
          <button
            type="button"
            disabled={pending}
            onClick={handleSelfSignUp}
            className="flex w-full items-center justify-center gap-1.5 border-t bg-muted/40 px-3 py-2 text-sm font-medium text-primary transition-colors first:border-t-0 hover:bg-accent disabled:opacity-50"
          >
            <UserPlus className="size-4" />
            {pending ? "Signing up…" : "Sign up for this role"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
