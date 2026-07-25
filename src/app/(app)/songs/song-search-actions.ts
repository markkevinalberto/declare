"use server";

import { requireScheduler } from "@/lib/auth/current-user";

export type ExternalSongResult = {
  id: number;
  trackName: string;
  artistName: string;
  artworkUrl: string | null;
};

type ITunesResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl60?: string;
};

export async function searchExternalSongs(
  query: string
): Promise<ExternalSongResult[]> {
  await requireScheduler();
  const q = query.trim();
  if (!q) return [];

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    q
  )}&media=music&entity=song&limit=8`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: ITunesResult[] };
    return (data.results ?? []).map((r) => ({
      id: r.trackId,
      trackName: r.trackName,
      artistName: r.artistName,
      artworkUrl: r.artworkUrl60 ?? null,
    }));
  } catch {
    return [];
  }
}
