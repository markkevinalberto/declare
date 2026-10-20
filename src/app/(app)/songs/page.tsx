import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SongDialog } from "./song-dialog";
import { SongsView } from "./songs-view";

export default async function SongsPage() {
  const profile = await requireOrgProfile();
  const isScheduler = profile.role === "admin" || profile.role === "leader";
  const supabase = await createClient();

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, artist, default_key, bpm, ccli_number, youtube_url, lyrics")
    .eq("org_id", profile.org_id)
    .order("title");

  return (
    <div className="grid max-w-3xl gap-4">
      <PageHero
        title="Songs"
        description="Your church's song library — tap a song to see lyrics and details."
        mascot="/mascot/full/girl_sitting_music.png"
        actions={isScheduler ? <SongDialog /> : null}
      />

      <SongsView songs={songs ?? []} isScheduler={isScheduler} />
    </div>
  );
}
