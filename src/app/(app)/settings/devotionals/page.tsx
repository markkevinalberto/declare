import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { DevotionalsEnabledToggle } from "./devotionals-enabled-toggle";
import { DevotionalList, type DevotionalRow } from "./devotional-list";

export default async function DevotionalsPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: org }, { data: devotionals }, { data: lastLog }] = await Promise.all([
    supabase
      .from("organizations")
      .select("devotionals_enabled, timezone")
      .eq("id", profile.org_id)
      .single(),
    supabase
      .from("devotionals")
      .select(
        "id, title, scripture_reference, scripture_text, reflection, reflection_question, prayer, sort_order"
      )
      .eq("org_id", profile.org_id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("devotional_log")
      .select("sent_on, recipient_count, devotionals(title, scripture_reference)")
      .eq("org_id", profile.org_id)
      .order("sent_on", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rows = (devotionals ?? []) as DevotionalRow[];
  const lastSent = lastLog?.devotionals as unknown as {
    title: string;
    scripture_reference: string;
  } | null;

  return (
    <div className="grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Weekly devotional</h1>
        <p className="text-sm text-muted-foreground">
          Every Sunday at 6:00 AM {org?.timezone ? `(${org.timezone})` : ""}, Declare
          emails and texts your whole active team the next devotional below,
          cycling through the list in order and looping back to the top.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send weekly devotional</CardTitle>
          <CardDescription>
            Goes to every active member&apos;s email, plus a text message for
            anyone with a mobile number on file.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <DevotionalsEnabledToggle
            initialEnabled={org?.devotionals_enabled ?? false}
            hasDevotionals={rows.length > 0}
          />
          {lastSent && lastLog ? (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Last sent {format(parseISO(lastLog.sent_on), "EEEE, MMMM d")} —{" "}
              <span className="font-medium text-foreground">{lastSent.title}</span>{" "}
              ({lastSent.scripture_reference}) to {lastLog.recipient_count}{" "}
              {lastLog.recipient_count === 1 ? "person" : "people"}.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Devotional library</CardTitle>
          <CardDescription>Sent in this order, then repeats from the top.</CardDescription>
        </CardHeader>
        <CardContent>
          <DevotionalList rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
