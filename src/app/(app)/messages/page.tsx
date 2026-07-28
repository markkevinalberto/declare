import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { ThreadList } from "./thread-list";
import { NewThreadDialog } from "./new-thread-dialog";

export default async function MessagesPage() {
  const profile = await requireOrgProfile();
  const isScheduler = profile.role === "admin" || profile.role === "leader";
  const supabase = await createClient();

  const [{ data: threads }, { data: org }] = await Promise.all([
    supabase
      .from("message_threads")
      .select("id, title, scope_type, created_at")
      .eq("org_id", profile.org_id),
    supabase.from("organizations").select("timezone").eq("id", profile.org_id).single(),
  ]);
  const timezone = org?.timezone ?? "UTC";

  const threadIds = (threads ?? []).map((t) => t.id);

  const [{ data: messages }, { data: reads }] = await Promise.all([
    threadIds.length > 0
      ? supabase
          .from("messages")
          .select("id, thread_id, body, user_id, created_at")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; thread_id: string; body: string; user_id: string; created_at: string }[] }),
    supabase.from("thread_reads").select("thread_id, last_read_at").eq("user_id", profile.id),
  ]);

  const lastReadByThread = new Map((reads ?? []).map((r) => [r.thread_id, r.last_read_at]));
  const latestByThread = new Map<string, { body: string; created_at: string }>();
  const unreadByThread = new Map<string, boolean>();

  for (const m of messages ?? []) {
    if (!latestByThread.has(m.thread_id)) {
      latestByThread.set(m.thread_id, { body: m.body, created_at: m.created_at });
    }
    const lastRead = lastReadByThread.get(m.thread_id);
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
      unreadByThread.set(m.thread_id, true);
    }
  }

  const rows = (threads ?? [])
    .map((t) => ({
      ...t,
      lastMessage: latestByThread.get(t.id) ?? null,
      unread: unreadByThread.get(t.id) ?? false,
    }))
    .sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.created_at;
      const bTime = b.lastMessage?.created_at ?? b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  let groups: { id: string; name: string }[] = [];
  let roles: { id: string; name: string }[] = [];
  let services: { id: string; title: string; starts_at: string }[] = [];

  if (isScheduler) {
    const [{ data: g }, { data: r }, { data: s }] = await Promise.all([
      supabase.from("role_groups").select("id, name").eq("org_id", profile.org_id).order("sort_order"),
      supabase.from("roles").select("id, name").eq("org_id", profile.org_id).order("sort_order"),
      supabase
        .from("services")
        .select("id, title, starts_at")
        .eq("org_id", profile.org_id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at"),
    ]);
    groups = g ?? [];
    roles = r ?? [];
    services = s ?? [];
  }

  return (
    <div className="grid max-w-xl gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Team chat by role group, role, or service.
          </p>
        </div>
        {isScheduler ? (
          <NewThreadDialog groups={groups} roles={roles} services={services} timezone={timezone} />
        ) : null}
      </div>

      <ThreadList threads={rows} />
    </div>
  );
}
