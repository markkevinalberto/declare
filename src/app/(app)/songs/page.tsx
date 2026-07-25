import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
          <p className="text-sm text-muted-foreground">
            Your church&apos;s song library — tap a song to see lyrics and
            details.
          </p>
        </div>
        {isScheduler ? <SongDialog /> : null}
      </div>

      <SongsView songs={songs ?? []} isScheduler={isScheduler} />
    </div>
  );
}
