import { notFound } from "next/navigation";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { normalizeMediaConfig } from "@/lib/media";
import { normalizeProjectionSettings } from "@/lib/projection";
import type { Song } from "@/app/(app)/songs/songs-view";
import { PresenterConsole, type PresentItem } from "./presenter-console";

export const metadata = { title: "Presenter — Declare" };

export default async function PresentPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id, title, starts_at")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();

  if (!service) notFound();

  const [{ data: items }, { data: settingsRow }, { data: bibles }] =
    await Promise.all([
      supabase
        .from("service_plan_items")
        .select(
          "id, type, title, description, bible_reference, bible_translation, bible_verses_override, content_text, projection_format, media_config, songs(id, title, artist, default_key, bpm, ccli_number, youtube_url, lyrics, projection_format)"
        )
        .eq("service_id", serviceId)
        .order("sort_order"),
      supabase
        .from("projection_settings")
        .select("settings")
        .eq("org_id", profile.org_id)
        .maybeSingle(),
      supabase
        .from("bibles")
        .select("id, name")
        .eq("org_id", profile.org_id)
        .order("name"),
    ]);

  const planItems: PresentItem[] = (items ?? []).flatMap(
    (item): PresentItem[] => {
      if (item.type === "song") {
        const song = item.songs as unknown as Song | null;
        if (!song) return [];
        return [{ planItemId: item.id, kind: "song", song }];
      }
      if (item.type === "bible") {
        if (!item.bible_reference || !item.bible_translation) return [];
        return [
          {
            planItemId: item.id,
            kind: "bible",
            reference: item.bible_reference,
            translation: item.bible_translation,
            translationLabel: item.description,
            versesOverride: item.bible_verses_override as unknown as
              | { verse: number; text: string }[]
              | null,
            projectionFormat: item.projection_format,
          },
        ];
      }
      if (item.type === "content") {
        return [
          {
            planItemId: item.id,
            kind: "content",
            text: item.content_text ?? "",
            projectionFormat: item.projection_format,
          },
        ];
      }
      if (item.type === "media") {
        return [
          {
            planItemId: item.id,
            kind: "media",
            title: item.title,
            files: normalizeMediaConfig(item.media_config).files,
          },
        ];
      }
      return [
        {
          planItemId: item.id,
          kind: item.type as "header" | "note" | "item",
          title: item.title,
        },
      ];
    }
  );

  return (
    <PresenterConsole
      service={service}
      items={planItems}
      orgId={profile.org_id}
      isScheduler={profile.role === "admin" || profile.role === "leader"}
      initialSettings={normalizeProjectionSettings(settingsRow?.settings)}
      bibles={bibles ?? []}
    />
  );
}
