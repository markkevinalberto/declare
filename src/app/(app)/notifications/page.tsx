import Link from "next/link";
import { Settings } from "lucide-react";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "./actions";
import { NotificationRow } from "./notification-row";

export default async function NotificationsPage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = (notifications ?? []).some((n) => !n.read_at);

  return (
    <div className="grid max-w-xl gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/settings/notifications" />}
          >
            <Settings /> Preferences
          </Button>
          {hasUnread ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="ghost" size="sm">
                Mark all read
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {!notifications || notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Invites, responses, reminders, and new messages will show up here.
        </p>
      ) : (
        <div className="grid gap-1.5">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
