import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { ServicesView } from "./services-view";
import { NewServiceButton } from "./new-service-button";

export default async function ServicesPage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();
  const isScheduler = profile.role === "admin" || profile.role === "leader";

  const [{ data: services }, { data: org }] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, starts_at, campus, series_id")
      .eq("org_id", profile.org_id)
      .order("starts_at", { ascending: true }),
    supabase.from("organizations").select("timezone").eq("id", profile.org_id).single(),
  ]);
  const timezone = org?.timezone ?? "UTC";

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground">
            Plan Sunday services and everything in between.
          </p>
        </div>
        {isScheduler ? <NewServiceButton /> : null}
      </div>

      <ServicesView services={services ?? []} isScheduler={isScheduler} timezone={timezone} />
    </div>
  );
}
