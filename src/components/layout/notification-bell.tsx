"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsRead } from "@/app/(app)/notifications/actions";
import {
  NotificationRow,
  type Notification,
} from "@/app/(app)/notifications/notification-row";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[] | null>(
    null
  );
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const [marking, setMarking] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && notifications === null) {
      const supabase = createClient();
      supabase
        .from("notifications")
        .select("id, type, title, body, link, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => setNotifications(data ?? []));
    }
  }

  function handleRead(id: string) {
    setNotifications((prev) =>
      prev
        ? prev.map((n) =>
            n.id === id && !n.read_at
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        : prev
    );
    setLocalUnread((count) => Math.max(0, count - 1));
  }

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications(
        (prev) => prev?.map((n) => (n.read_at ? n : { ...n, read_at: now })) ?? prev
      );
      setLocalUnread(0);
    } finally {
      setMarking(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="size-4" />
        {localUnread > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {localUnread > 9 ? "9+" : localUnread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader className="flex-row items-center justify-between">
          <PopoverTitle>Notifications</PopoverTitle>
          <div className="flex items-center gap-1">
            {localUnread > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={marking}
                onClick={handleMarkAllRead}
              >
                {marking ? <Loader2 className="animate-spin" /> : null} Mark all
                read
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={
                <Link
                  href="/settings/notifications"
                  aria-label="Notification preferences"
                />
              }
            >
              <Settings className="size-3.5" />
            </Button>
          </div>
        </PopoverHeader>

        {notifications === null ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : notifications.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Invites, responses, reminders, and new messages will show up here.
          </p>
        ) : (
          <ScrollArea className="h-80">
            <div className="grid gap-1 pr-2">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={() => handleRead(n.id)}
                  onSelect={() => setOpen(false)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-xs"
          nativeButton={false}
          render={<Link href="/notifications" onClick={() => setOpen(false)} />}
        >
          View all
        </Button>
      </PopoverContent>
    </Popover>
  );
}
