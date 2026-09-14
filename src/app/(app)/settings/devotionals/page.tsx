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

  const [{ data: org }, { data: devotionals }] = await Promise.all([
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
  ]);

  const rows = (devotionals ?? []) as DevotionalRow[];

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
        <CardContent>
          <DevotionalsEnabledToggle
            initialEnabled={org?.devotionals_enabled ?? false}
            hasDevotionals={rows.length > 0}
          />
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
