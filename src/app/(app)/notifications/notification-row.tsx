"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  MessageSquare,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationRead } from "./actions";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const ICONS: Record<string, typeof Bell> = {
  invite: Bell,
  accepted: UserCheck,
  declined: UserX,
  reminder: Bell,
  message: MessageSquare,
  service_updated: Bell,
  service_cancelled: X,
  position_removed: X,
};

export function NotificationRow({
  notification,
  onRead,
  onSelect,
}: {
  notification: Notification;
  /** Called immediately when an unread notification is clicked, so a caller
   * keeping its own copy of the list (e.g. the header popover) can update
   * its unread count without waiting on a full page revalidation. */
  onRead?: () => void;
  /** Called on every click, read or not — lets a popover close itself since
   * navigating doesn't unmount it (the app shell persists across routes). */
  onSelect?: () => void;
}) {
  const router = useRouter();
  const Icon = ICONS[notification.type] ?? Bell;
  const unread = !notification.read_at;

  function handleClick() {
    if (unread) {
      markNotificationRead(notification.id);
      onRead?.();
    }
    onSelect?.();
    if (notification.link) router.push(notification.link);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
        unread && "bg-muted/40"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("text-sm", unread && "font-medium")}>
            {notification.title}
          </span>
          {unread ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
        </span>
        {notification.body ? (
          <span className="block text-xs text-muted-foreground">{notification.body}</span>
        ) : null}
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </span>
      {!unread ? <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> : null}
    </button>
  );
}
