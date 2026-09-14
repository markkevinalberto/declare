import { format, parseISO } from "date-fns";
import { BookOpen, Heart, HelpCircle, Quote, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { PrayedCheck } from "./prayed-check";

type DevotionalDetail = {
  title: string;
  scripture_reference: string;
  scripture_text: string | null;
  reflection: string;
  reflection_question: string | null;
  prayer: string | null;
};

export default async function DevotionalPage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: lastLog } = await supabase
    .from("devotional_log")
    .select(
      "sent_on, devotional_id, devotionals(title, scripture_reference, scripture_text, reflection, reflection_question, prayer)"
    )
    .eq("org_id", profile.org_id)
    .order("sent_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  const devotional = lastLog?.devotionals as unknown as DevotionalDetail | null;

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Devotional</h1>
        <p className="text-sm text-muted-foreground">
          {lastLog
            ? `Sent ${format(parseISO(lastLog.sent_on), "EEEE, MMMM d")}.`
            : "Your church's weekly devotional shows up here."}
        </p>
      </div>

      {!devotional || !lastLog ? (
        <Card className="animate-fade-up">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-md shadow-primary/25">
              <BookOpen className="size-7 text-primary-foreground" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Nothing&apos;s gone out yet — your first weekly devotional shows up
              here after the next Sunday send.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden py-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-chart-2 px-6 py-8 text-primary-foreground">
            <Quote className="absolute -top-3 -right-3 size-28 rotate-12 text-white/10" />
            <p className="relative text-xs font-semibold tracking-wider text-primary-foreground/80 uppercase">
              {devotional.scripture_reference}
            </p>
            <h2 className="relative mt-1 text-2xl font-semibold tracking-tight text-balance">
              {devotional.title}
            </h2>
            {devotional.scripture_text ? (
              <p className="relative mt-4 border-l-2 border-white/40 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground/90 italic">
                {devotional.scripture_text}
              </p>
            ) : null}
          </div>

          <CardContent className="grid gap-4 py-6">
            <div className="grid gap-3 text-[15px] leading-relaxed text-foreground/90">
              {devotional.reflection.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {devotional.reflection_question || devotional.prayer ? (
              <div className="grid gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                  <Sparkles className="size-3.5" /> Reflect &amp; Pray
                </p>
                {devotional.reflection_question ? (
                  <div className="flex gap-2.5">
                    <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary/70" />
                    <p className="text-sm font-medium">{devotional.reflection_question}</p>
                  </div>
                ) : null}
                {devotional.prayer ? (
                  <div className="flex gap-2.5">
                    <Heart className="mt-0.5 size-4 shrink-0 text-primary/70" />
                    <p className="text-sm text-muted-foreground italic">{devotional.prayer}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex justify-center pt-1">
              <PrayedCheck storageKey={`devotional-prayed-${lastLog.devotional_id}`} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
