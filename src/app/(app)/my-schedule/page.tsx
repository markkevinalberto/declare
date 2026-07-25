import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { MyScheduleView } from "./my-schedule-view";

export default async function MySchedulePage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: positions } = await supabase
    .from("positions")
    .select("id, status, services(id, title, starts_at, campus), roles(name)")
    .eq("user_id", profile.id)
    .neq("status", "draft");

  const rows = (positions ?? [])
    .map((p) => ({
      id: p.id,
      status: p.status,
      service: p.services as unknown as {
        id: string;
        title: string;
        starts_at: string;
        campus: string | null;
      } | null,
      role: p.roles as unknown as { name: string } | null,
    }))
    .filter((p): p is typeof p & { service: NonNullable<typeof p.service> } => Boolean(p.service))
    .sort(
      (a, b) => new Date(a.service.starts_at).getTime() - new Date(b.service.starts_at).getTime()
    );

  return (
    <div className="grid max-w-xl gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Your upcoming appointments — accept or decline below.
        </p>
      </div>
      <MyScheduleView rows={rows} />
    </div>
  );
}
