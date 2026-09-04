"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Music, Search, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { deleteSong } from "./actions";
import { SongDialog } from "./song-dialog";

export type Song = {
  id: string;
  title: string;
  artist: string | null;
  default_key: string | null;
  bpm: number | null;
  ccli_number: string | null;
  youtube_url: string | null;
  lyrics: string | null;
  /** Presenter-only text-format overrides — not edited from this library view. */
  projection_format?: Record<string, unknown> | null;
};

const SONG_PART_LINE = /^\[(.+)\]$/;

function LyricsDisplay({ lyrics }: { lyrics: string }) {
  return (
    <div className="relative z-10 whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-sans text-sm leading-relaxed">
      {lyrics.split(/\r\n|\r|\n/).map((rawLine, i) => {
        const line = rawLine.trimEnd();
        const match = line.match(SONG_PART_LINE);
        if (match) {
          return (
            <div key={i} className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary first:mt-0">
              {match[1]}
            </div>
          );
        }
        return <div key={i}>{line || " "}</div>;
      })}
    </div>
  );
}

function VideoAttachment({ url }: { url: string }) {
  const embed = youtubeEmbedUrl(url);

  if (embed) {
    return (
      <div className="relative isolate z-0 aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-black">
        <iframe
          src={embed}
          title="Attached video"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
    >
      <ExternalLink className="size-3.5" /> Listen / watch
    </a>
  );
}

function LyricsDialog({ song }: { song: Song }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          />
        }
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Music className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{song.title}</span>
          {song.artist ? (
            <span className="block truncate text-sm text-muted-foreground">
              {song.artist}
            </span>
          ) : null}
        </span>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85svh] flex-col gap-5 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{song.title}</DialogTitle>
          {song.artist ? <DialogDescription>{song.artist}</DialogDescription> : null}
        </DialogHeader>
        {song.default_key || song.bpm || song.ccli_number ? (
          <div className="flex flex-wrap gap-1.5">
            {song.default_key ? <Badge variant="secondary">Key of {song.default_key}</Badge> : null}
            {song.bpm ? <Badge variant="secondary">{song.bpm} BPM</Badge> : null}
            {song.ccli_number ? <Badge variant="outline">CCLI {song.ccli_number}</Badge> : null}
          </div>
        ) : null}
        {song.youtube_url ? <VideoAttachment url={song.youtube_url} /> : null}
        {song.lyrics ? (
          <LyricsDisplay lyrics={song.lyrics} />
        ) : (
          <p className="text-sm text-muted-foreground">No lyrics added yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SongsView({
  songs,
  isScheduler,
}: {
  songs: Song[];
  isScheduler: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist ?? "").toLowerCase().includes(q) ||
        (s.ccli_number ?? "").includes(q)
    );
  }, [songs, search]);

  return (
    <div className="grid gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, artist, or CCLI…"
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            {songs.length === 0 ? (
              <>
                <Music className="size-6" />
                <p className="font-medium text-foreground">No songs yet</p>
                <p>
                  {isScheduler
                    ? "Build your library — add the songs your team sings."
                    : "Leaders haven't added any songs yet."}
                </p>
              </>
            ) : (
              <>
                <SearchX className="size-6" />
                <p>No songs match your search.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((song) => (
            <Card key={song.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <LyricsDialog song={song} />
                <div className="flex shrink-0 items-center gap-1.5">
                  {song.default_key ? (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {song.default_key}
                    </Badge>
                  ) : null}
                  {song.bpm ? (
                    <Badge variant="outline" className="hidden md:inline-flex">
                      {song.bpm} BPM
                    </Badge>
                  ) : null}
                  {song.youtube_url ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={
                        <a
                          href={song.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open "${song.title}" on YouTube`}
                        />
                      }
                    >
                      <ExternalLink />
                    </Button>
                  ) : null}
                  {isScheduler ? (
                    <>
                      <SongDialog song={song} />
                      <ConfirmDeleteButton
                        action={deleteSong.bind(null, song.id)}
                        title={`Delete “${song.title}”?`}
                        description="It will be removed from the library. Services that already include it keep their plan entry."
                      />
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
