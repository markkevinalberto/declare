"use server";

import { revalidatePath } from "next/cache";
import { requireOrgProfile, requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import {
  bookName,
  parseReference,
  parseEditableVerses,
  type EditableVerse,
} from "@/lib/bible";
import { normalizeMediaConfig, type MediaConfig } from "@/lib/media";
import {
  normalizeProjectionSettings,
  normalizeSongFormat,
  type ProjectionSettings,
  type SongProjectionFormat,
} from "@/lib/projection";

export async function saveProjectionSettings(settings: ProjectionSettings) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const normalized = normalizeProjectionSettings(settings);
  // blob: URLs point at files on the presenter's machine — they only live
  // for that browser session, so persist a plain black background instead.
  if (normalized.bgUrl.startsWith("blob:")) {
    normalized.bgUrl = "";
    normalized.bgType = "none";
  }

  const { error } = await supabase.from("projection_settings").upsert({
    org_id: profile.org_id,
    settings: normalized,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "Could not save projection settings." };
  return {};
}

export async function saveSongProjectionFormat(
  songId: string,
  format: SongProjectionFormat | null
) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const normalized = format ? normalizeSongFormat(format) : null;
  const { error } = await supabase
    .from("songs")
    .update({
      projection_format: normalized && Object.keys(normalized).length > 0
        ? normalized
        : null,
    })
    .eq("id", songId)
    .eq("org_id", profile.org_id);

  if (error) return { error: "Could not save the song's text format." };
  return {};
}

export async function addBiblePlanItem(
  serviceId: string,
  reference: string,
  translation: string,
  translationLabel: string
) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();
  if (!service) return { error: "Service not found." };

  const { count } = await supabase
    .from("service_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  const { error } = await supabase.from("service_plan_items").insert({
    service_id: serviceId,
    type: "bible",
    title: reference,
    description: translationLabel,
    duration_minutes: 0,
    sort_order: count ?? 0,
    bible_reference: reference,
    bible_translation: translation,
  });

  if (error) return { error: "Could not add the verse to the service plan." };
  revalidatePath(`/services/${serviceId}`);
  return {};
}

export async function addContentPlanItem(serviceId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();
  if (!service) return { error: "Service not found." };

  const { count } = await supabase
    .from("service_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  const { data, error } = await supabase
    .from("service_plan_items")
    .insert({
      service_id: serviceId,
      type: "content",
      // Blank — the presenter derives a display title from the content text
      // until the operator explicitly renames it via savePlanItemTitle.
      title: "",
      content_text: "Type anything here…",
      duration_minutes: 0,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not add the content slide." };
  revalidatePath(`/services/${serviceId}`);
  return { planItemId: data.id as string };
}

export async function addMediaPlanItem(serviceId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();
  if (!service) return { error: "Service not found." };

  const { count } = await supabase
    .from("service_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  const { data, error } = await supabase
    .from("service_plan_items")
    .insert({
      service_id: serviceId,
      type: "media",
      // Blank — the presenter derives a display title until renamed.
      title: "",
      duration_minutes: 0,
      sort_order: count ?? 0,
      media_config: { files: [] },
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not add the media item." };
  revalidatePath(`/services/${serviceId}`);
  return { planItemId: data.id as string };
}

export async function saveMediaConfig(planItemId: string, config: MediaConfig) {
  await requireScheduler();
  const supabase = await createClient();

  const normalized = normalizeMediaConfig(config);
  const { error } = await supabase
    .from("service_plan_items")
    .update({ media_config: normalized })
    .eq("id", planItemId);

  if (error) return { error: "Could not save the media item." };
  return {};
}

export async function saveContentText(planItemId: string, html: string) {
  await requireScheduler();
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_plan_items")
    .update({ content_text: html })
    .eq("id", planItemId);

  if (error) return { error: "Could not save the content slide." };
  return {};
}

/**
 * Sets an explicit display title for a content or media plan item,
 * overriding the presenter's auto-derived one (content preview text, or
 * "Media"/file count). Pass an empty string to go back to auto-deriving it.
 */
export async function savePlanItemTitle(planItemId: string, title: string) {
  await requireScheduler();
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_plan_items")
    .update({ title: title.trim() })
    .eq("id", planItemId);

  if (error) return { error: "Could not rename this item." };
  return {};
}

/**
 * Overrides a Bible plan item's verse wording for this service plan only —
 * the source bible (built-in translation or uploaded XML) is never touched.
 * Pass an empty string to clear the override and revert to the original.
 */
export async function saveBibleVerseOverride(
  planItemId: string,
  rawText: string
) {
  await requireScheduler();
  const supabase = await createClient();

  const verses: EditableVerse[] = rawText.trim()
    ? parseEditableVerses(rawText)
    : [];
  if (rawText.trim() && verses.length === 0) {
    return { error: "Couldn't read any verses — keep each verse on its own line, starting with its number." };
  }

  const { error } = await supabase
    .from("service_plan_items")
    .update({ bible_verses_override: verses.length > 0 ? verses : null })
    .eq("id", planItemId);

  if (error) return { error: "Could not save the edited verse text." };
  return {};
}

export async function saveBiblePlanItemFormat(
  planItemId: string,
  format: SongProjectionFormat | null
) {
  await requireScheduler();
  const supabase = await createClient();

  const normalized = format ? normalizeSongFormat(format) : null;
  const { error } = await supabase
    .from("service_plan_items")
    .update({
      projection_format:
        normalized && Object.keys(normalized).length > 0 ? normalized : null,
    })
    .eq("id", planItemId);

  if (error) return { error: "Could not save the verse's text format." };
  return {};
}

export type BibleVerse = { verse: number; text: string };
export type BiblePassage = {
  reference: string;
  translation: string;
  verses: BibleVerse[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lookupUploadedPassage(
  bibleId: string,
  reference: string
): Promise<{ passage?: BiblePassage; error?: string }> {
  const parsed = parseReference(reference);
  if (!parsed) {
    return { error: "Couldn't read that reference — try “John 14:1-4”." };
  }

  const supabase = await createClient();
  const [{ data: bible }, versesQuery] = await Promise.all([
    supabase.from("bibles").select("id, name").eq("id", bibleId).single(),
    (() => {
      let query = supabase
        .from("bible_verses")
        .select("verse, text")
        .eq("bible_id", bibleId)
        .eq("book", parsed.book)
        .eq("chapter", parsed.chapter)
        .order("verse");
      if (parsed.verseStart !== null) {
        query = query
          .gte("verse", parsed.verseStart)
          .lte("verse", parsed.verseEnd ?? parsed.verseStart);
      }
      return query;
    })(),
  ]);

  if (!bible) return { error: "That bible is no longer available." };
  const verses = versesQuery.data ?? [];
  if (verses.length === 0) {
    return { error: "Passage not found in this bible — check the reference." };
  }

  const range =
    parsed.verseStart !== null
      ? `:${parsed.verseStart}${parsed.verseEnd ? `-${parsed.verseEnd}` : ""}`
      : "";
  return {
    passage: {
      reference: `${bookName(parsed.book)} ${parsed.chapter}${range}`,
      translation: bible.name,
      verses,
    },
  };
}

export async function lookupBiblePassage(
  reference: string,
  translation: string
): Promise<{ passage?: BiblePassage; error?: string }> {
  await requireOrgProfile();

  const ref = reference.trim();
  if (!ref) return { error: "Type a reference, e.g. John 14:1-4" };

  if (UUID_PATTERN.test(translation)) {
    return lookupUploadedPassage(translation, ref);
  }

  const allowed = ["web", "kjv", "asv", "bbe"];
  const version = allowed.includes(translation) ? translation : "web";

  try {
    const response = await fetch(
      `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    if (!response.ok) {
      return { error: "Passage not found — check the reference." };
    }
    const data = (await response.json()) as {
      reference?: string;
      translation_name?: string;
      verses?: { verse: number; text: string }[];
    };
    if (!data.verses?.length) {
      return { error: "Passage not found — check the reference." };
    }
    return {
      passage: {
        reference: data.reference ?? ref,
        translation: data.translation_name ?? version.toUpperCase(),
        verses: data.verses.map((v) => ({
          verse: v.verse,
          text: v.text.replace(/\s+/g, " ").trim(),
        })),
      },
    };
  } catch {
    return { error: "Could not reach the Bible service. Are you online?" };
  }
}
