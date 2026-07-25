"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Music, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSong, updateSong, type SongActionState } from "./actions";
import { SongPartsLyricsField } from "./song-parts-lyrics-field";
import { SongSearchField } from "./song-search-field";
import { YouTubeSearchField } from "./youtube-search-field";
import type { Song } from "./songs-view";

function externalSearchUrl(base: string, title: string, artist: string) {
  const q = [title, artist].filter(Boolean).join(" ");
  return `${base}${encodeURIComponent(q)}`;
}

export function SongDialog({
  song,
  onSaved,
}: {
  song?: Song;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(song?.title ?? "");
  const [artist, setArtist] = useState(song?.artist ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(song?.youtube_url ?? "");
  const editing = Boolean(song);

  const action = editing
    ? updateSong.bind(null, song!.id)
    : createSong;

  const [state, formAction, pending] = useActionState(
    async (prevState: SongActionState, formData: FormData) => {
      const result = await action(prevState, formData);
      if (!result?.error) {
        setOpen(false);
        toast.success(editing ? "Song updated" : "Song added to the library");
        onSaved?.();
      }
      return result;
    },
    undefined
  );

  const idPrefix = song ? `song-${song.id}` : "song-new";
  const canSearchOnline = Boolean(title.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTitle(song?.title ?? "");
          setArtist(song?.artist ?? "");
          setYoutubeUrl(song?.youtube_url ?? "");
        }
      }}
    >
      {editing ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Pencil />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus /> Add song
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="size-4 text-primary" />
            {editing ? "Edit song" : "Add a song"}
          </DialogTitle>
        </DialogHeader>

        <SongSearchField
          onPick={(picked) => {
            setTitle(picked.title);
            setArtist(picked.artist);
            // We can't legally auto-fill lyrics text (see Genius's API
            // terms), so jump straight to their search results in a new
            // tab — copy/paste from there is the fastest safe path.
            window.open(
              externalSearchUrl("https://genius.com/search?q=", picked.title, picked.artist),
              "_blank",
              "noreferrer"
            );
          }}
        />

        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-title`}>Title</Label>
            <Input
              id={`${idPrefix}-title`}
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Way Maker"
              required
              autoFocus={!editing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-artist`}>Artist / author</Label>
            <Input
              id={`${idPrefix}-artist`}
              name="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Sinach"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-key`}>Key</Label>
              <Input
                id={`${idPrefix}-key`}
                name="default_key"
                defaultValue={song?.default_key ?? ""}
                placeholder="E"
                maxLength={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-bpm`}>BPM</Label>
              <Input
                id={`${idPrefix}-bpm`}
                name="bpm"
                type="number"
                min={20}
                max={300}
                defaultValue={song?.bpm ?? ""}
                placeholder="68"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-ccli`}>CCLI #</Label>
              <Input
                id={`${idPrefix}-ccli`}
                name="ccli_number"
                defaultValue={song?.ccli_number ?? ""}
                placeholder="7115744"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-youtube`}>YouTube / reference link</Label>
              {canSearchOnline ? (
                <a
                  href={externalSearchUrl(
                    "https://www.youtube.com/results?search_query=",
                    title,
                    artist
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-4"
                >
                  Search on YouTube <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
            <YouTubeSearchField
              defaultQuery={[title, artist].filter(Boolean).join(" ")}
              attachedUrl={youtubeUrl}
              onPick={(url) => setYoutubeUrl(url)}
            />
            <Input
              id={`${idPrefix}-youtube`}
              name="youtube_url"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Lyrics</span>
              {canSearchOnline ? (
                <a
                  href={externalSearchUrl(
                    "https://genius.com/search?q=",
                    title,
                    artist
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-4"
                >
                  Find lyrics on Genius <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
            <SongPartsLyricsField
              id={`${idPrefix}-lyrics`}
              defaultValue={song?.lyrics ?? ""}
              hideLabel
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add song"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
