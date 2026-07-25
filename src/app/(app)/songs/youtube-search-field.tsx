"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Pencil, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchYouTubeVideos,
  youtubeSearchAvailable,
  type YouTubeResult,
} from "./youtube-search-actions";
import { extractYouTubeId, youtubeEmbedUrl } from "@/lib/youtube";

export function YouTubeSearchField({
  defaultQuery,
  attachedUrl,
  onPick,
}: {
  defaultQuery: string;
  attachedUrl: string;
  onPick: (url: string) => void;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [searching, setSearching] = useState(!attachedUrl);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    youtubeSearchAvailable().then(setAvailable);
  }, []);

  function runSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchYouTubeVideos(value);
        setResults(data);
      });
    }, 400);
  }

  function handleFocus() {
    if (!query && defaultQuery) {
      setQuery(defaultQuery);
      runSearch(defaultQuery);
    }
  }

  function handlePick(url: string) {
    onPick(url);
    setQuery("");
    setResults(null);
    // Collapse the search box now that a video is attached.
    setSearching(false);
  }

  if (!available) return null;

  const attachedId = extractYouTubeId(attachedUrl);

  if (!searching && attachedId) {
    return (
      <div className="grid gap-2">
        <div className="relative isolate aspect-video w-full overflow-hidden rounded-lg border bg-black">
          <iframe
            key={attachedId}
            src={youtubeEmbedUrl(attachedUrl) ?? undefined}
            title="Attached video preview"
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setSearching(true)}
        >
          <Pencil /> Change video
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onFocus={handleFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            runSearch(e.target.value);
          }}
          placeholder="Search YouTube for the video…"
          className="pl-8"
        />
      </div>

      {pending ? <p className="text-xs text-muted-foreground">Searching…</p> : null}
      {results && results.length === 0 && !pending ? (
        <p className="text-xs text-muted-foreground">No videos found.</p>
      ) : null}

      {results && results.length > 0 ? (
        <div className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border p-1.5">
          {results.map((video) => {
            const isAttached = attachedUrl === video.url;
            return (
              <button
                key={video.videoId}
                type="button"
                onClick={() => handlePick(video.url)}
                className="flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted"
              >
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="h-9 w-16 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-16 shrink-0 items-center justify-center rounded bg-muted">
                    <Video className="size-4 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{video.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {video.channelTitle}
                  </span>
                </span>
                {isAttached ? (
                  <Check className="size-4 shrink-0 text-green-600" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {attachedId ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => setSearching(false)}
        >
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
