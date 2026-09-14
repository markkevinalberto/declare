"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type DevotionalActionState = { error?: string } | undefined;

const devotionalSchema = z.object({
  title: z.string().min(1, "Title is required."),
  scriptureReference: z.string().min(1, "Scripture reference is required."),
  scriptureText: z.string().optional(),
  reflection: z.string().min(1, "Reflection is required."),
  reflectionQuestion: z.string().optional(),
  prayer: z.string().optional(),
});

export type DevotionalInput = {
  title: string;
  scriptureReference: string;
  scriptureText: string;
  reflection: string;
  reflectionQuestion: string;
  prayer: string;
};

export async function createDevotional(input: DevotionalInput): Promise<DevotionalActionState> {
  const profile = await requireAdmin();
  const parsed = devotionalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("devotionals")
    .select("sort_order")
    .eq("org_id", profile.org_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("devotionals").insert({
    org_id: profile.org_id,
    title: parsed.data.title,
    scripture_reference: parsed.data.scriptureReference,
    scripture_text: parsed.data.scriptureText?.trim() || null,
    reflection: parsed.data.reflection,
    reflection_question: parsed.data.reflectionQuestion?.trim() || null,
    prayer: parsed.data.prayer?.trim() || null,
    sort_order: (last?.sort_order ?? 0) + 1,
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/settings/devotionals");
  return undefined;
}

export async function updateDevotional(
  id: string,
  input: DevotionalInput
): Promise<DevotionalActionState> {
  const profile = await requireAdmin();
  const parsed = devotionalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("devotionals")
    .update({
      title: parsed.data.title,
      scripture_reference: parsed.data.scriptureReference,
      scripture_text: parsed.data.scriptureText?.trim() || null,
      reflection: parsed.data.reflection,
      reflection_question: parsed.data.reflectionQuestion?.trim() || null,
      prayer: parsed.data.prayer?.trim() || null,
    })
    .eq("id", id)
    .eq("org_id", profile.org_id);
  if (error) return { error: error.message };

  revalidatePath("/settings/devotionals");
  return undefined;
}

export async function deleteDevotional(id: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await supabase.from("devotionals").delete().eq("id", id).eq("org_id", profile.org_id);
  revalidatePath("/settings/devotionals");
}

export async function reorderDevotional(id: string, direction: "up" | "down") {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("devotionals")
    .select("id, sort_order")
    .eq("org_id", profile.org_id)
    .order("sort_order", { ascending: true });
  if (!rows) return;

  const index = rows.findIndex((r) => r.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= rows.length) return;

  const current = rows[index];
  const swapWith = rows[swapIndex];
  await Promise.all([
    supabase
      .from("devotionals")
      .update({ sort_order: swapWith.sort_order })
      .eq("id", current.id),
    supabase
      .from("devotionals")
      .update({ sort_order: current.sort_order })
      .eq("id", swapWith.id),
  ]);
  revalidatePath("/settings/devotionals");
}

export async function setDevotionalsEnabled(enabled: boolean): Promise<{ error?: string }> {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ devotionals_enabled: enabled })
    .eq("id", profile.org_id);
  if (error) return { error: error.message };

  revalidatePath("/settings/devotionals");
  return {};
}
