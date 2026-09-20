import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { CardIcon } from "./card-icon";

/**
 * A compact teaser for the most recently sent weekly devotional, meant to
 * be dropped into pages members already visit (dashboard, services) so the
 * feature is discoverable without a dedicated trip to the Devotional nav
 * item. Renders nothing for orgs that haven't turned the feature on, or
 * before the first Sunday send has gone out.
 */
export async function DevotionalPreviewCard() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("devotionals_enabled")
    .eq("id", profile.org_id)
    .single();
  if (!org?.devotionals_enabled) return null;

  const { data: lastLog } = await supabase
    .from("devotional_log")
    .select("devotionals(title, scripture_reference)")
    .eq("org_id", profile.org_id)
    .order("sent_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  const devotional = lastLog?.devotionals as unknown as {
    title: string;
    scripture_reference: string;
  } | null;
  if (!devotional) return null;

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <CardIcon icon={BookOpen} /> This week&apos;s devotional
        </CardTitle>
        <CardDescription>{devotional.scripture_reference}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/devotional"
          className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm"
        >
          <span className="min-w-0 truncate font-medium">{devotional.title}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}
