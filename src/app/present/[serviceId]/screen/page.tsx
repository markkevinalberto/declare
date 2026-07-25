import { notFound } from "next/navigation";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { ProjectionScreen } from "./projection-screen";

export const metadata = { title: "Projector — Declare" };

export default async function ProjectorPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();

  if (!service) notFound();

  return <ProjectionScreen serviceId={serviceId} />;
}
