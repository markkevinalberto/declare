"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrgProfile, requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type MessagesActionState = { error?: string } | undefined;

const threadSchema = z.object({
  scope_type: z.enum(["role_group", "role", "service"]),
  scope_id: z.string().min(1, "Pick who this is for."),
  title: z.string().min(1, "Title is required."),
});

export async function createThread(
  _prevState: MessagesActionState,
  formData: FormData
): Promise<MessagesActionState> {
  const profile = await requireScheduler();
  const parsed = threadSchema.safeParse({
    scope_type: formData.get("scope_type"),
    scope_id: formData.get("scope_id"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: thread, error } = await supabase
    .from("message_threads")
    .insert({
      org_id: profile.org_id,
      scope_type: parsed.data.scope_type,
      scope_id: parsed.data.scope_id,
      title: parsed.data.title,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !thread) return { error: error?.message ?? "Could not create thread." };

  revalidatePath("/messages");
  redirect(`/messages/${thread.id}`);
}

const messageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function sendMessage(
  threadId: string,
  formData: FormData
): Promise<MessagesActionState> {
  const profile = await requireOrgProfile();
  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message." };

  const supabase = await createClient();
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      user_id: profile.id,
      body: parsed.data.body,
    })
    .select("id")
    .single();
  if (error || !message) return { error: error?.message ?? "Could not send message." };

  await supabase
    .from("thread_reads")
    .upsert({ thread_id: threadId, user_id: profile.id, last_read_at: new Date().toISOString() });

  await supabase.rpc("notify_thread_message", {
    p_thread_id: threadId,
    p_message_id: message.id,
  });

  revalidatePath(`/messages/${threadId}`);
  return undefined;
}

export async function markThreadRead(threadId: string) {
  const profile = await requireOrgProfile();
  const supabase = await createClient();
  await supabase
    .from("thread_reads")
    .upsert({ thread_id: threadId, user_id: profile.id, last_read_at: new Date().toISOString() });
  revalidatePath("/messages");
}
