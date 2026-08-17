import { notFound } from "next/navigation";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FEATURES } from "@/lib/features";
import { ServiceHeader } from "./service-header";
import { PlanBuilder } from "./plan-builder";
import type { PlanItem } from "./plan-item-row";
import { PeopleTab, type PositionRow } from "./people-tab";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireOrgProfile();
  const isScheduler = profile.role === "admin" || profile.role === "leader";
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id, title, starts_at, campus, notes, share_token")
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .single();

  if (!service) notFound();

  const { data: org } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", profile.org_id)
    .single();
  const timezone = org?.timezone ?? "UTC";

  const emptyPeople = Promise.resolve({
    data: [] as { id: string; name: string; email: string; active: boolean }[],
  });
  const emptyUserRoles = Promise.resolve({
    data: [] as { user_id: string; role_id: string }[],
  });

  // Plan items aren't fetched at all while the plan builder is hidden —
  // one less query, and there's nothing to render them into anyway.
  const emptyItems = Promise.resolve({ data: [] as PlanItem[] });

  const [{ data: items }, { data: groups }, { data: roles }, { data: positions }, { data: userRoles }, { data: people }] =
    await Promise.all([
      FEATURES.planning
        ? supabase
            .from("service_plan_items")
            .select("*")
            .eq("service_id", id)
            .order("sort_order")
        : emptyItems,
      supabase
        .from("role_groups")
        .select("id, name, sort_order")
        .eq("org_id", profile.org_id)
        .order("sort_order"),
      supabase
        .from("roles")
        .select("id, role_group_id, name, sort_order")
        .eq("org_id", profile.org_id)
        .order("sort_order"),
      supabase
        .from("positions")
        .select(
          "id, role_id, user_id, status, invited_at, responded_at, profiles!positions_user_id_fkey(id, name, email, avatar_url)"
        )
        .eq("service_id", id),
      // Only schedulers need role holdings (to pick who to assign, and for
      // their own self sign-up eligibility).
      isScheduler
        ? supabase.from("user_roles").select("user_id, role_id").eq("org_id", profile.org_id)
        : emptyUserRoles,
      isScheduler
        ? supabase
            .from("profiles")
            .select("id, name, email, active")
            .eq("org_id", profile.org_id)
            .eq("active", true)
            .order("name")
        : emptyPeople,
    ]);

  const peopleTab = (
    <PeopleTab
      serviceId={id}
      groups={groups ?? []}
      roles={roles ?? []}
      positions={(positions ?? []) as unknown as PositionRow[]}
      userRoles={userRoles ?? []}
      people={people ?? []}
      isScheduler={isScheduler}
      currentUserId={profile.id}
    />
  );

  return (
    <div className="grid gap-4">
      <ServiceHeader service={service} isScheduler={isScheduler} timezone={timezone} />
      {FEATURES.planning ? (
        <Tabs defaultValue="plan">
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>
          <TabsContent value="plan">
            <PlanBuilder serviceId={id} initialItems={items ?? []} isScheduler={isScheduler} />
          </TabsContent>
          <TabsContent value="people">{peopleTab}</TabsContent>
        </Tabs>
      ) : (
        peopleTab
      )}
    </div>
  );
}
