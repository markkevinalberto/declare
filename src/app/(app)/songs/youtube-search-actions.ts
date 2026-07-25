"use server";

import { requireScheduler } from "@/lib/auth/current-user";

export type YouTubeResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  url: string;
};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { default?: { url?: string } };
  };
};

export async function youtubeSearchAvailable() {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

export async function searchYouTubeVideos(
  query: string
): Promise<YouTubeResult[]> {
  await requireScheduler();
  const apiKey = process.env.YOUTUBE_API_KEY;
  const q = query.trim();
  if (!apiKey || !q) return [];

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(
    q
  )}&key=${apiKey}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: YouTubeSearchItem[] };
    return (data.items ?? [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        videoId: item.id!.videoId!,
        title: item.snippet?.title ?? "Untitled",
        channelTitle: item.snippet?.channelTitle ?? "",
        thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? null,
        url: `https://www.youtube.com/watch?v=${item.id!.videoId}`,
      }));
  } catch {
    return [];
  }
}
