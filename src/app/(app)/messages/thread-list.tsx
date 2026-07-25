import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users, User, CalendarDays, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  title: string;
  scope_type: "role_group" | "role" | "service";
  created_at: string;
  lastMessage: { body: string; created_at: string } | null;
  unread: boolean;
};

const SCOPE_ICON = { role_group: Users, role: User, service: CalendarDays };

export function ThreadList({ threads }: { threads: Thread[] }) {
  if (threads.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="size-4" /> No conversations yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {threads.map((thread) => {
        const Icon = SCOPE_ICON[thread.scope_type];
        return (
          <Link key={thread.id} href={`/messages/${thread.id}`}>
            <Card className={cn(thread.unread && "bg-muted/40")}>
              <CardContent className="flex items-center gap-3 py-3">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm", thread.unread && "font-semibold")}>
                      {thread.title}
                    </span>
                    {thread.unread ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  {thread.lastMessage ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {thread.lastMessage.body}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(thread.lastMessage?.created_at ?? thread.created_at),
                    { addSuffix: true }
                  )}
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
