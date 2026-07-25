"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Music, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { addSongPlanItem } from "./actions";

type LibrarySong = {
  id: string;
  title: string;
  artist: string | null;
  default_key: string | null;
};

export function SongPickerPopover({
  serviceId,
  onAdded,
}: {
  serviceId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<LibrarySong[] | null>(null);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && songs === null) {
      const supabase = createClient();
      supabase
        .from("songs")
        .select("id, title, artist, default_key")
        .order("title")
        .then(({ data }) => setSongs(data ?? []));
    }
  }

  function handleAdd(songId: string) {
    startTransition(async () => {
      await addSongPlanItem(serviceId, songId);
      setOpen(false);
      toast.success("Song added to the plan");
      onAdded();
    });
  }

  const q = search.trim().toLowerCase();
  const filtered = (songs ?? []).filter(
    (s) =>
      !q ||
      s.title.toLowerCase().includes(q) ||
      (s.artist ?? "").toLowerCase().includes(q)
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <Music /> Song
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Add a song from the library</PopoverTitle>
        </PopoverHeader>
        {songs === null ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
        ) : songs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The library is empty —{" "}
            <Link href="/songs" className="font-medium text-primary underline underline-offset-4">
              add songs
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="grid gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search songs…"
                className="pl-8"
              />
            </div>
            <ScrollArea className="h-56">
              <div className="grid gap-1 pr-2">
                {filtered.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No matches.
                  </p>
                ) : (
                  filtered.map((song) => (
                    <button
                      key={song.id}
                      type="button"
                      disabled={pending}
                      onClick={() => handleAdd(song.id)}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{song.title}</span>
                        {song.artist ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {song.artist}
                          </span>
                        ) : null}
                      </span>
                      {song.default_key ? (
                        <Badge variant="secondary" className="shrink-0">
                          {song.default_key}
                        </Badge>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
