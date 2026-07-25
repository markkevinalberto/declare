const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYouTubeId(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(YOUTUBE_ID_PATTERN);
  return match?.[1] ?? null;
}

export function youtubeThumbnail(url: string | null | undefined) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function youtubeEmbedUrl(
  url: string | null | undefined,
  { autoplay = false }: { autoplay?: boolean } = {}
) {
  const id = extractYouTubeId(url);
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}${autoplay ? "?autoplay=1" : ""}`
    : null;
}
