import { notFound } from "next/navigation";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { StageDisplay } from "./stage-display";

export const metadata = { title: "Stage display — Declare" };

export default async function StagePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();

  if (!service) notFound();

  return <StageDisplay serviceId={serviceId} serviceTitle={service.title} />;
}
