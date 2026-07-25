/**
 * Content slides store their body as HTML (bullets, numbered lists, and
 * alignment need structure plain text can't carry). These helpers keep that
 * HTML honest across two boundaries: legacy plain-text slides saved before
 * the rich editor existed (no tags at all — a bare "\n" would otherwise
 * collapse into a single space when rendered as HTML, losing every line
 * break), and deriving a plain-text preview/title from either form. Pure
 * string operations only, so the same functions work in a server action and
 * in client components.
 */

const HTML_TAG_HINT = /<\/?(p|ul|ol|li|br|div|strong|em|span|b|i)[ >/]/i;

export function looksLikeHtml(text: string): boolean {
  return HTML_TAG_HINT.test(text);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Wraps each line in its own `<p>` so line breaks survive as real paragraphs. */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

/** Passes through content that's already HTML; upgrades legacy plain text. */
export function ensureRichHtml(text: string): string {
  return looksLikeHtml(text) ? text : plainTextToHtml(text);
}

/** Strips tags for a plain-text preview/title, from either HTML or plain text. */
export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rough plain-text lines from HTML — one per paragraph/list item/`<br>` —
 * for surfaces that show plain lyrics-style lines rather than rendering the
 * HTML itself (the stage display's band-monitor view has no notion of
 * bullets or alignment, so a content slide's rich body falls back to this).
 */
export function richHtmlToLines(html: string): string[] {
  return html
    .replace(/<\/(p|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// A paragraph containing nothing but two-or-more dashes (e.g. "--", "---")
// acts as a manual slide break, the same way a blank line separates verses
// in a song — lets one content item project as several tiled slides.
const SLIDE_BREAK_PATTERN = /<p(?:\s[^>]*)?>\s*-{2,}\s*<\/p>/gi;

/** Splits a content slide's HTML into one chunk per manual slide break. */
export function splitRichHtmlIntoSlides(html: string): string[] {
  const parts = html
    .split(SLIDE_BREAK_PATTERN)
    .map((part) => part.trim())
    .filter((part) => stripHtmlToText(part).length > 0);
  return parts.length > 0 ? parts : [html];
}
