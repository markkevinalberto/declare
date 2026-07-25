const SONG_PART_LINE = /^\[(.+)\]$/;

/** Max lyric lines shown on one projection slide before splitting. */
const MAX_LINES_PER_SLIDE = 6;

export type LyricSlide = {
  /** Song part label, e.g. "Verse 1" — null for unlabeled stanzas. */
  label: string | null;
  lines: string[];
};

/**
 * Split lyrics text into projection slides: each `[Part]` marker starts a
 * new labeled section, blank lines split a section into stanzas, and
 * stanzas longer than MAX_LINES_PER_SLIDE are chunked.
 */
export function parseLyricsToSlides(lyrics: string): LyricSlide[] {
  const slides: LyricSlide[] = [];
  let label: string | null = null;
  let stanza: string[] = [];

  function flush() {
    for (let i = 0; i < stanza.length; i += MAX_LINES_PER_SLIDE) {
      slides.push({ label, lines: stanza.slice(i, i + MAX_LINES_PER_SLIDE) });
    }
    stanza = [];
  }

  for (const rawLine of lyrics.split(/\r\n|\r|\n/)) {
    const line = rawLine.trim();
    const match = line.match(SONG_PART_LINE);
    if (match) {
      flush();
      label = match[1];
    } else if (!line) {
      flush();
    } else {
      stanza.push(line);
    }
  }
  flush();

  return slides;
}
