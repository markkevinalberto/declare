import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
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
      <PageHero
        title="Blockout Dates"
        description="Let schedulers know when you're unavailable to serve."
        mascot="/mascot/full/boy_running.png"
      />

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
