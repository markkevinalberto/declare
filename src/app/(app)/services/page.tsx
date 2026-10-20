import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PageMascot } from "@/components/shared/page-mascot";
import { DevotionalPreviewCard } from "@/components/shared/devotional-preview-card";
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
      <div className="relative flex items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground">
            Plan Sunday services and everything in between.
          </p>
        </div>
        {/* Parked left of the New Service button, which stays layered above it */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/mm_girl_peace.png"
          alt=""
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-6 z-10 hidden h-44 w-auto drop-shadow-lg lg:block",
            isScheduler ? "right-40" : "right-2"
          )}
        />
        {/* Phones/tablets: in-flow version, so it can't overlap the button */}
        <PageMascot src="/mascot/mm_girl_peace.png" className="lg:hidden" />
        {isScheduler ? (
          <div className="relative z-20">
            <NewServiceButton />
          </div>
        ) : null}
      </div>

      <DevotionalPreviewCard />

      <ServicesView services={services ?? []} isScheduler={isScheduler} timezone={timezone} />
    </div>
  );
}
