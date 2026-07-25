"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type BlockoutActionState = { error?: string } | undefined;

const blockoutSchema = z
  .object({
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    reason: z.string().optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after the start date.",
    path: ["end_date"],
  });

export async function createBlockout(
  _prevState: BlockoutActionState,
  formData: FormData
): Promise<BlockoutActionState> {
  const profile = await requireOrgProfile();
  const parsed = blockoutSchema.safeParse({
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("blockout_dates").insert({
    org_id: profile.org_id,
    user_id: profile.id,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    reason: parsed.data.reason ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/blockouts");
  return undefined;
}

export async function updateBlockout(
  blockoutId: string,
  _prevState: BlockoutActionState,
  formData: FormData
): Promise<BlockoutActionState> {
  const profile = await requireOrgProfile();
  const parsed = blockoutSchema.safeParse({
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("blockout_dates")
    .update({
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      reason: parsed.data.reason ?? null,
    })
    .eq("id", blockoutId)
    .eq("user_id", profile.id);
  if (error) return { error: error.message };

  revalidatePath("/blockouts");
  return undefined;
}

export async function deleteBlockout(blockoutId: string) {
  const profile = await requireOrgProfile();
  const supabase = await createClient();
  await supabase
    .from("blockout_dates")
    .delete()
    .eq("id", blockoutId)
    .eq("user_id", profile.id);
  revalidatePath("/blockouts");
}
