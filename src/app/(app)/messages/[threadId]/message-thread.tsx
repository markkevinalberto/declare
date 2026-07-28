"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatInOrgTime } from "@/lib/org-time";
import { markThreadRead, sendMessage } from "../actions";

type Message = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
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

export function MessageThread({
  threadId,
  title,
  currentUserId,
  initialMessages,
  timezone,
}: {
  threadId: string;
  title: string;
  currentUserId: string;
  initialMessages: Message[];
  timezone: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markThreadRead(threadId);
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();

    async function refetch() {
      const { data } = await supabase
        .from("messages")
        .select("id, body, user_id, created_at, profiles!messages_user_id_fkey(name, email, avatar_url)")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(
          data.map((m) => {
            const profile = m.profiles as unknown as {
              name: string;
              email: string;
              avatar_url: string | null;
            } | null;
            return {
              id: m.id,
              body: m.body,
              user_id: m.user_id,
              created_at: m.created_at,
              authorName: profile?.name || profile?.email || "Unknown",
              authorAvatar: profile?.avatar_url ?? null,
            };
          })
        );
      }
      markThreadRead(threadId);
    }

    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  async function handleSend() {
    if (!body.trim()) return;
    setPending(true);
    const formData = new FormData();
    formData.set("body", body);
    const sentBody = body;
    setBody("");
    const result = await sendMessage(threadId, formData);
    if (result?.error) {
      setBody(sentBody);
      toast.error(result.error);
    }
    setPending(false);
  }

  return (
    <div className="grid h-[calc(100svh-8rem)] max-w-xl grid-rows-[auto_1fr_auto] gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/messages" />}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <ScrollArea className="rounded-lg border p-3">
        <div className="grid gap-3">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === currentUserId;
              return (
                <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                  {!mine ? (
                    <Avatar className="mt-4 size-7 shrink-0">
                      {m.authorAvatar ? (
                        <AvatarImage src={m.authorAvatar} alt={m.authorName} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {initials(m.authorName) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className={cn("flex flex-col gap-0.5", mine && "items-end")}>
                    <span className="text-xs text-muted-foreground">
                      {mine ? "You" : m.authorName} · {formatInOrgTime(m.created_at, timezone, "MMM d, h:mm a")}
                    </span>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      {m.body}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a message…"
          rows={2}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={pending || !body.trim()} size="icon">
          <Send />
        </Button>
      </div>
    </div>
  );
}
