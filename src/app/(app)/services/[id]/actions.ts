"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type PlanItemType = Database["public"]["Tables"]["service_plan_items"]["Row"]["type"];

const DEFAULT_TITLES: Record<PlanItemType, string> = {
  header: "New Section",
  note: "Note",
  item: "New Item",
  song: "Song",
  bible: "Bible reading",
  content: "Content slide",
  media: "Media",
};

export async function createPlanItem(serviceId: string, type: PlanItemType) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();
  if (!service) return;

  const { count } = await supabase
    .from("service_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  await supabase.from("service_plan_items").insert({
    service_id: serviceId,
    type,
    title: DEFAULT_TITLES[type],
    duration_minutes: type === "item" ? 5 : 0,
    sort_order: count ?? 0,
  });

  revalidatePath(`/services/${serviceId}`);
}

export async function addSongPlanItem(serviceId: string, songId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const [{ data: service }, { data: song }] = await Promise.all([
    supabase
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("org_id", profile.org_id)
      .single(),
    supabase
      .from("songs")
      .select("id, title, artist, default_key")
      .eq("id", songId)
      .eq("org_id", profile.org_id)
      .single(),
  ]);
  if (!service || !song) return;

  const { count } = await supabase
    .from("service_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  await supabase.from("service_plan_items").insert({
    service_id: serviceId,
    type: "song",
    title: song.title,
    description: song.artist,
    duration_minutes: 5,
    sort_order: count ?? 0,
    song_id: song.id,
    song_key: song.default_key,
  });

  revalidatePath(`/services/${serviceId}`);
}

const updateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(0).max(600),
});

export async function updatePlanItem(
  itemId: string,
  serviceId: string,
  data: { title: string; description?: string; duration_minutes: number }
) {
  await requireScheduler();
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("service_plan_items")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      duration_minutes: parsed.data.duration_minutes,
    })
    .eq("id", itemId);

  revalidatePath(`/services/${serviceId}`);
}

export async function deletePlanItem(itemId: string, serviceId: string) {
  await requireScheduler();
  const supabase = await createClient();
  await supabase.from("service_plan_items").delete().eq("id", itemId);
  revalidatePath(`/services/${serviceId}`);
}

export async function reorderPlanItems(serviceId: string, orderedIds: string[]) {
  await requireScheduler();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("service_plan_items").update({ sort_order: index }).eq("id", id)
    )
  );
  revalidatePath(`/services/${serviceId}`);
}
