"use client";

import { useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchExternalSongs,
  type ExternalSongResult,
} from "./song-search-actions";

export function SongSearchField({
  onPick,
}: {
  onPick: (song: { title: string; artist: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalSongResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchExternalSongs(value);
        setResults(data);
      });
    }, 400);
  }

  function handleChange(value: string) {
    setQuery(value);
    runSearch(value);
  }

  function handlePick(song: ExternalSongResult) {
    onPick({ title: song.trackName, artist: song.artistName });
    setQuery("");
    setResults(null);
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search for a song to auto-fill title & artist…"
          className="pl-8 pr-8"
        />
        {query ? (
          <button
            type="button"
            onClick={() => handleChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {pending ? (
        <p className="text-xs text-muted-foreground">Searching…</p>
      ) : null}

      {results && results.length === 0 && !pending ? (
        <p className="text-xs text-muted-foreground">No matches found.</p>
      ) : null}

      {results && results.length > 0 ? (
        <div className="grid gap-1 rounded-lg border p-1.5">
          {results.map((song) => (
            <Button
              key={song.id}
              type="button"
              variant="ghost"
              onClick={() => handlePick(song)}
              className="h-auto min-w-0 justify-start gap-2.5 px-2 py-1.5"
            >
              {song.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={song.artworkUrl}
                  alt=""
                  className="size-8 shrink-0 rounded"
                />
              ) : (
                <span className="size-8 shrink-0 rounded bg-muted" />
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-normal">
                  {song.trackName}
                </span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {song.artistName}
                </span>
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
