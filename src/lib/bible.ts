// bible-api.com serves public-domain translations for free (no key).
// Modern licensed translations (NIV, ESV, …) can't legally be fetched.
export const BIBLE_TRANSLATIONS = [
  { id: "web", label: "World English Bible" },
  { id: "kjv", label: "King James Version" },
  { id: "asv", label: "American Standard Version" },
  { id: "bbe", label: "Bible in Basic English" },
] as const;

export type EditableVerse = { verse: number; text: string };

/** "1 Yahweh is my shepherd…\n2 He makes me lie down…" — one verse per line. */
export function formatEditableVerses(verses: EditableVerse[]): string {
  return verses.map((v) => `${v.verse} ${v.text}`).join("\n");
}

/**
 * Parses a leader's freeform edit back into verses. A line starting with a
 * number is a new verse; anything else (extra notes, a wrapped line) is
 * appended to the previous verse so a leader can freely add words without
 * needing to keep everything on one line.
 */
export function parseEditableVerses(text: string): EditableVerse[] {
  const verses: EditableVerse[] = [];
  for (const rawLine of text.split(/\r\n|\r|\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^(\d+)\s+(.*)$/);
    if (match) {
      verses.push({ verse: Number(match[1]), text: match[2] });
    } else if (verses.length > 0) {
      verses[verses.length - 1].text += ` ${line}`;
    }
  }
  return verses;
}

// Standard Protestant book numbering (1–66), as used by Zefania XML.
const BOOK_ALIASES: Record<string, number> = {};

const BOOKS: [number, string, string[]][] = [
  [1, "Genesis", ["gen", "ge", "gn"]],
  [2, "Exodus", ["exo", "ex", "exod"]],
  [3, "Leviticus", ["lev", "le", "lv"]],
  [4, "Numbers", ["num", "nu", "nm", "nb"]],
  [5, "Deuteronomy", ["deut", "deu", "dt"]],
  [6, "Joshua", ["josh", "jos", "jsh"]],
  [7, "Judges", ["judg", "jdg", "jg", "jdgs"]],
  [8, "Ruth", ["rth", "ru"]],
  [9, "1 Samuel", ["1 sam", "1sam", "1 sm", "1sa", "i samuel"]],
  [10, "2 Samuel", ["2 sam", "2sam", "2 sm", "2sa", "ii samuel"]],
  [11, "1 Kings", ["1 kgs", "1kgs", "1 ki", "1ki", "i kings"]],
  [12, "2 Kings", ["2 kgs", "2kgs", "2 ki", "2ki", "ii kings"]],
  [13, "1 Chronicles", ["1 chr", "1chr", "1 ch", "1ch", "i chronicles"]],
  [14, "2 Chronicles", ["2 chr", "2chr", "2 ch", "2ch", "ii chronicles"]],
  [15, "Ezra", ["ezr"]],
  [16, "Nehemiah", ["neh", "ne"]],
  [17, "Esther", ["esth", "est", "es"]],
  [18, "Job", ["jb"]],
  [19, "Psalms", ["psalm", "ps", "psa", "psm", "pss"]],
  [20, "Proverbs", ["prov", "pro", "prv", "pr"]],
  [21, "Ecclesiastes", ["eccl", "ecc", "ec", "qoh"]],
  [22, "Song of Solomon", ["song", "song of songs", "sos", "so", "canticles"]],
  [23, "Isaiah", ["isa", "is"]],
  [24, "Jeremiah", ["jer", "je", "jr"]],
  [25, "Lamentations", ["lam", "la"]],
  [26, "Ezekiel", ["ezek", "eze", "ezk"]],
  [27, "Daniel", ["dan", "da", "dn"]],
  [28, "Hosea", ["hos", "ho"]],
  [29, "Joel", ["jl"]],
  [30, "Amos", ["am"]],
  [31, "Obadiah", ["obad", "ob"]],
  [32, "Jonah", ["jnh", "jon"]],
  [33, "Micah", ["mic", "mc"]],
  [34, "Nahum", ["nah", "na"]],
  [35, "Habakkuk", ["hab", "hb"]],
  [36, "Zephaniah", ["zeph", "zep", "zp"]],
  [37, "Haggai", ["hag", "hg"]],
  [38, "Zechariah", ["zech", "zec", "zc"]],
  [39, "Malachi", ["mal", "ml"]],
  [40, "Matthew", ["matt", "mat", "mt"]],
  [41, "Mark", ["mrk", "mk", "mr"]],
  [42, "Luke", ["luk", "lk"]],
  [43, "John", ["jhn", "jn"]],
  [44, "Acts", ["act", "ac"]],
  [45, "Romans", ["rom", "ro", "rm"]],
  [46, "1 Corinthians", ["1 cor", "1cor", "1 co", "1co", "i corinthians"]],
  [47, "2 Corinthians", ["2 cor", "2cor", "2 co", "2co", "ii corinthians"]],
  [48, "Galatians", ["gal", "ga"]],
  [49, "Ephesians", ["eph", "ephes"]],
  [50, "Philippians", ["phil", "php", "pp"]],
  [51, "Colossians", ["col", "co"]],
  [52, "1 Thessalonians", ["1 thess", "1thess", "1 th", "1th", "i thessalonians"]],
  [53, "2 Thessalonians", ["2 thess", "2thess", "2 th", "2th", "ii thessalonians"]],
  [54, "1 Timothy", ["1 tim", "1tim", "1 ti", "1ti", "i timothy"]],
  [55, "2 Timothy", ["2 tim", "2tim", "2 ti", "2ti", "ii timothy"]],
  [56, "Titus", ["tit", "ti"]],
  [57, "Philemon", ["philem", "phm", "pm"]],
  [58, "Hebrews", ["heb"]],
  [59, "James", ["jas", "jm"]],
  [60, "1 Peter", ["1 pet", "1pet", "1 pe", "1pe", "i peter"]],
  [61, "2 Peter", ["2 pet", "2pet", "2 pe", "2pe", "ii peter"]],
  [62, "1 John", ["1 jn", "1jn", "1 jhn", "i john"]],
  [63, "2 John", ["2 jn", "2jn", "2 jhn", "ii john"]],
  [64, "3 John", ["3 jn", "3jn", "3 jhn", "iii john"]],
  [65, "Jude", ["jud", "jd"]],
  [66, "Revelation", ["rev", "re", "apocalypse"]],
];

for (const [number, name, aliases] of BOOKS) {
  BOOK_ALIASES[name.toLowerCase()] = number;
  for (const alias of aliases) BOOK_ALIASES[alias] = number;
}

export function bookName(book: number): string {
  return BOOKS.find(([n]) => n === book)?.[1] ?? `Book ${book}`;
}

export type ParsedReference = {
  book: number;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
};

/** Parse "John 14:1-4", "1 John 3:16", or "Psalm 23" (English book names). */
export function parseReference(input: string): ParsedReference | null {
  const match = input
    .trim()
    .match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!match) return null;
  const book = BOOK_ALIASES[match[1].trim().toLowerCase().replace(/\.$/, "")];
  if (!book) return null;
  return {
    book,
    chapter: Number(match[2]),
    verseStart: match[3] ? Number(match[3]) : null,
    verseEnd: match[4] ? Number(match[4]) : null,
  };
}

export type ParsedBible = {
  name: string;
  verses: { book: number; chapter: number; verse: number; text: string }[];
};

type VerseRow = ParsedBible["verses"][number];

// OSIS book IDs (Gen, Exod, …) → standard book number.
const OSIS_BOOKS: Record<string, number> = {
  gen: 1, exod: 2, lev: 3, num: 4, deut: 5, josh: 6, judg: 7, ruth: 8,
  "1sam": 9, "2sam": 10, "1kgs": 11, "2kgs": 12, "1chr": 13, "2chr": 14,
  ezra: 15, neh: 16, esth: 17, job: 18, ps: 19, prov: 20, eccl: 21,
  song: 22, isa: 23, jer: 24, lam: 25, ezek: 26, dan: 27, hos: 28,
  joel: 29, amos: 30, obad: 31, jonah: 32, mic: 33, nah: 34, hab: 35,
  zeph: 36, hag: 37, zech: 38, mal: 39, matt: 40, mark: 41, luke: 42,
  john: 43, acts: 44, rom: 45, "1cor": 46, "2cor": 47, gal: 48, eph: 49,
  phil: 50, col: 51, "1thess": 52, "2thess": 53, "1tim": 54, "2tim": 55,
  titus: 56, phlm: 57, heb: 58, jas: 59, "1pet": 60, "2pet": 61,
  "1john": 62, "2john": 63, "3john": 64, jude: 65, rev: 66,
};

// USFM/USFX book codes (GEN, EXO, …) → standard book number.
const USFM_BOOKS: Record<string, number> = {
  gen: 1, exo: 2, lev: 3, num: 4, deu: 5, jos: 6, jdg: 7, rut: 8,
  "1sa": 9, "2sa": 10, "1ki": 11, "2ki": 12, "1ch": 13, "2ch": 14,
  ezr: 15, neh: 16, est: 17, job: 18, psa: 19, pro: 20, ecc: 21,
  sng: 22, isa: 23, jer: 24, lam: 25, ezk: 26, dan: 27, hos: 28,
  jol: 29, amo: 30, oba: 31, jon: 32, mic: 33, nam: 34, hab: 35,
  zep: 36, hag: 37, zec: 38, mal: 39, mat: 40, mrk: 41, luk: 42,
  jhn: 43, act: 44, rom: 45, "1co": 46, "2co": 47, gal: 48, eph: 49,
  php: 50, col: 51, "1th": 52, "2th": 53, "1ti": 54, "2ti": 55,
  tit: 56, phm: 57, heb: 58, jas: 59, "1pe": 60, "2pe": 61,
  "1jn": 62, "2jn": 63, "3jn": 64, jud: 65, rev: 66,
};

function cleanText(text: string | null | undefined) {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

/** Zefania: XMLBIBLE > BIBLEBOOK bnumber > CHAPTER cnumber > VERS vnumber. */
function parseZefania(root: Element, doc: Document): ParsedBible | null {
  const name =
    root.getAttribute("biblename") ??
    doc.querySelector("INFORMATION > title, information > title")
      ?.textContent ??
    "Uploaded Bible";

  const verses: VerseRow[] = [];
  for (const bookEl of root.querySelectorAll("BIBLEBOOK, biblebook")) {
    const book = Number(bookEl.getAttribute("bnumber"));
    if (!book) continue;
    for (const chapterEl of bookEl.querySelectorAll("CHAPTER, chapter")) {
      const chapter = Number(chapterEl.getAttribute("cnumber"));
      if (!chapter) continue;
      for (const verseEl of chapterEl.querySelectorAll("VERS, vers")) {
        const verse = Number(verseEl.getAttribute("vnumber"));
        const text = cleanText(verseEl.textContent);
        if (verse && text) verses.push({ book, chapter, verse, text });
      }
    }
  }
  return verses.length > 0 ? { name: cleanText(name), verses } : null;
}

/** OSIS: <verse osisID="John.3.16">…</verse> (or sID/eID milestone pairs). */
function parseOsis(root: Element): ParsedBible | null {
  const name =
    cleanText(
      root.querySelector("work > title, header title")?.textContent
    ) || "Uploaded Bible";

  function refToRow(osisId: string, text: string): VerseRow | null {
    const [bookId, chapterStr, verseStr] = osisId.split(".");
    const book = OSIS_BOOKS[bookId?.toLowerCase() ?? ""];
    const chapter = Number(chapterStr);
    const verse = Number(verseStr);
    if (!book || !chapter || !verse || !text) return null;
    return { book, chapter, verse, text };
  }

  const verses: VerseRow[] = [];

  // Container form first.
  for (const el of root.querySelectorAll("verse[osisID]")) {
    if (el.hasAttribute("sID") || el.hasAttribute("eID")) continue;
    const row = refToRow(el.getAttribute("osisID") ?? "", cleanText(el.textContent));
    if (row) verses.push(row);
  }

  // Milestone form: <verse sID …/>text<verse eID …/>.
  if (verses.length === 0) {
    for (const start of root.querySelectorAll("verse[sID]")) {
      let text = "";
      let node: Node | null = start.nextSibling;
      while (node) {
        if (
          node instanceof Element &&
          node.tagName.toLowerCase() === "verse"
        ) {
          break;
        }
        if (
          !(node instanceof Element) ||
          !["note", "title"].includes(node.tagName.toLowerCase())
        ) {
          text += node.textContent ?? "";
        }
        node = node.nextSibling;
      }
      const row = refToRow(
        start.getAttribute("osisID") ?? start.getAttribute("sID") ?? "",
        cleanText(text)
      );
      if (row) verses.push(row);
    }
  }

  return verses.length > 0 ? { name, verses } : null;
}

/** USFX: <book id="JHN"> with <c id/> and <v id/> milestones. */
function parseUsfx(root: Element): ParsedBible | null {
  const verses: VerseRow[] = [];
  const SKIP = new Set(["f", "x", "fe", "note", "h", "toc", "id", "ide"]);

  for (const bookEl of root.querySelectorAll("book[id]")) {
    const book = USFM_BOOKS[(bookEl.getAttribute("id") ?? "").toLowerCase()];
    if (!book) continue;

    let chapter = 0;
    let verse = 0;
    let text = "";

    function flush() {
      const t = cleanText(text);
      if (chapter && verse && t) verses.push({ book, chapter, verse, text: t });
      text = "";
    }

    function walk(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (verse) text += node.textContent ?? "";
        return;
      }
      if (!(node instanceof Element)) return;
      const tag = node.tagName.toLowerCase();
      if (SKIP.has(tag)) return;
      if (tag === "c") {
        flush();
        verse = 0;
        chapter = Number(node.getAttribute("id"));
        return;
      }
      if (tag === "v") {
        flush();
        verse = Number(node.getAttribute("id"));
        return;
      }
      if (tag === "ve") {
        flush();
        verse = 0;
        return;
      }
      for (const child of Array.from(node.childNodes)) walk(child);
    }

    for (const child of Array.from(bookEl.childNodes)) walk(child);
    flush();
  }

  return verses.length > 0 ? { name: "Uploaded Bible", verses } : null;
}

/** Generic/Beblia style: <bible><book number><chapter number><verse number>. */
function parseGeneric(root: Element): ParsedBible | null {
  const name =
    root.getAttribute("translation") ??
    root.getAttribute("name") ??
    "Uploaded Bible";

  function numberOf(el: Element, ...attrs: string[]) {
    for (const attr of attrs) {
      const value = el.getAttribute(attr);
      if (value) return Number(value);
    }
    return 0;
  }

  const verses: VerseRow[] = [];
  const books = root.querySelectorAll("book, b");
  books.forEach((bookEl, index) => {
    let book = numberOf(bookEl, "number", "n", "id");
    if (!book) {
      const bookName = (
        bookEl.getAttribute("name") ?? bookEl.getAttribute("bname") ?? ""
      ).toLowerCase();
      book = BOOK_ALIASES[bookName] ?? 0;
    }
    if (!book) book = index + 1; // books in canonical order is the common case
    for (const chapterEl of bookEl.querySelectorAll("chapter, c")) {
      const chapter = numberOf(chapterEl, "number", "n", "id");
      if (!chapter) continue;
      for (const verseEl of chapterEl.querySelectorAll("verse, v")) {
        const verse = numberOf(verseEl, "number", "n", "id");
        const text = cleanText(verseEl.textContent);
        if (verse && text) verses.push({ book, chapter, verse, text });
      }
    }
  });

  return verses.length > 0 ? { name: cleanText(name), verses } : null;
}

/**
 * Parse a bible XML file, auto-detecting the format: Zefania, OSIS, USFX,
 * or the generic <bible><book><chapter><verse> style (e.g. Beblia).
 * Browser-only (uses DOMParser).
 */
export function parseBibleXml(xml: string): ParsedBible | null {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return null;

  const root = doc.documentElement;
  const tag = root.tagName.toLowerCase();

  if (tag === "xmlbible" || tag === "x") return parseZefania(root, doc);
  if (tag === "osis") return parseOsis(root);
  if (tag === "usfx") return parseUsfx(root);
  if (tag === "bible") return parseGeneric(root);
  return null;
}
