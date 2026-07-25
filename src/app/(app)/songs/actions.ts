"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type SongActionState = { error?: string } | undefined;

const songSchema = z.object({
  title: z.string().min(1, "Title is required."),
  artist: z.string().optional(),
  default_key: z.string().max(6, "Keep the key short, e.g. G or F#m.").optional(),
  bpm: z.union([z.coerce.number().int().min(20).max(300), z.literal("")]).optional(),
  ccli_number: z.string().optional(),
  youtube_url: z
    .union([z.url({ error: "Enter a valid link." }), z.literal("")])
    .optional(),
  lyrics: z.string().optional(),
});

function parseSong(formData: FormData) {
  return songSchema.safeParse({
    title: formData.get("title"),
    artist: formData.get("artist") || undefined,
    default_key: formData.get("default_key") || undefined,
    bpm: formData.get("bpm") || "",
    ccli_number: formData.get("ccli_number") || undefined,
    youtube_url: formData.get("youtube_url") || "",
    lyrics: formData.get("lyrics") || undefined,
  });
}

function toRow(data: z.infer<typeof songSchema>) {
  return {
    title: data.title,
    artist: data.artist || null,
    default_key: data.default_key || null,
    bpm: data.bpm === "" || data.bpm === undefined ? null : data.bpm,
    ccli_number: data.ccli_number || null,
    youtube_url: data.youtube_url || null,
    lyrics: data.lyrics || null,
  };
}

export async function createSong(
  _prevState: SongActionState,
  formData: FormData
): Promise<SongActionState> {
  const profile = await requireScheduler();
  const parsed = parseSong(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("songs").insert({
    ...toRow(parsed.data),
    org_id: profile.org_id,
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/songs");
  return undefined;
}

export async function updateSong(
  songId: string,
  _prevState: SongActionState,
  formData: FormData
): Promise<SongActionState> {
  const profile = await requireScheduler();
  const parsed = parseSong(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("songs")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", songId)
    .eq("org_id", profile.org_id);
  if (error) return { error: error.message };

  revalidatePath("/songs");
  return undefined;
}

export async function deleteSong(songId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();
  const { error } = await supabase
    .from("songs")
    .delete()
    .eq("id", songId)
    .eq("org_id", profile.org_id);
  if (error) throw new Error(error.message);
  revalidatePath("/songs");
}
