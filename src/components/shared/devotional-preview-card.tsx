import Link from "next/link";
import { BookOpen, ChevronRight, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { CardIcon } from "./card-icon";

/**
 * A compact teaser for the most recently sent weekly devotional, meant to
 * be dropped into pages members already visit (dashboard, services) so the
 * feature is discoverable without a dedicated trip to the Devotional nav
 * item. Mirrors the gradient/Quote-watermark styling of the full /devotional
 * page so the two feel like the same feature. Renders nothing for orgs that
 * haven't turned the feature on, or before the first Sunday send has gone out.
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
    .select("devotionals(title, scripture_reference, scripture_text)")
    .eq("org_id", profile.org_id)
    .order("sent_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  const devotional = lastLog?.devotionals as unknown as {
    title: string;
    scripture_reference: string;
    scripture_text: string | null;
  } | null;
  if (!devotional) return null;

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <CardIcon icon={BookOpen} /> This week&apos;s devotional
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          href="/devotional"
          className="group relative block overflow-hidden rounded-xl bg-gradient-to-br from-primary to-chart-2 p-4 text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/30"
        >
          <Quote className="absolute -top-3 -right-2 size-20 rotate-12 text-white/10" />
          <p className="relative text-[11px] font-semibold tracking-wider text-primary-foreground/80 uppercase">
            {devotional.scripture_reference}
          </p>
          <p className="relative mt-1 truncate text-base font-semibold tracking-tight">
            {devotional.title}
          </p>
          {devotional.scripture_text ? (
            <p className="relative mt-2 line-clamp-2 border-l-2 border-white/40 pl-2.5 text-sm leading-relaxed text-primary-foreground/90 italic">
              {devotional.scripture_text}
            </p>
          ) : null}
          <span className="relative mt-3 flex items-center gap-1 text-xs font-medium text-primary-foreground/80 group-hover:text-primary-foreground">
            Read the full devotional
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
