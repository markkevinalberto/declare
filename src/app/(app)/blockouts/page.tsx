import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewBlockoutForm } from "./new-blockout-form";
import { BlockoutList } from "./blockout-list";

export default async function BlockoutsPage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: blockouts } = await supabase
    .from("blockout_dates")
    .select("id, start_date, end_date, reason")
    .eq("user_id", profile.id)
    .order("start_date", { ascending: false });

  return (
    <div className="grid max-w-xl gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blockout Dates</h1>
        <p className="text-sm text-muted-foreground">
          Let schedulers know when you&apos;re unavailable to serve.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a blockout</CardTitle>
          <CardDescription>Covers every day in the range, inclusive.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewBlockoutForm />
        </CardContent>
      </Card>

      <BlockoutList blockouts={blockouts ?? []} />
    </div>
  );
}
