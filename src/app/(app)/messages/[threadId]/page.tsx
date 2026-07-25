import { notFound } from "next/navigation";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "./message-thread";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("message_threads")
    .select("id, title, scope_type")
    .eq("id", threadId)
    .single();

  if (!thread) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, user_id, created_at, profiles!messages_user_id_fkey(name, email, avatar_url)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  type Author = { name: string; email: string; avatar_url: string | null } | null;

  return (
    <MessageThread
      threadId={thread.id}
      title={thread.title}
      currentUserId={profile.id}
      initialMessages={(messages ?? []).map((m) => ({
        id: m.id,
        body: m.body,
        user_id: m.user_id,
        created_at: m.created_at,
        authorName:
          (m.profiles as unknown as Author)?.name ??
          (m.profiles as unknown as Author)?.email ??
          "Unknown",
        authorAvatar: (m.profiles as unknown as Author)?.avatar_url ?? null,
      }))}
    />
  );
}
