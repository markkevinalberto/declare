/**
 * Walks a .pptx file's OOXML structure (per the ECMA-376 spec) to pull out,
 * for each slide in presentation order, its plain text and any embedded
 * images. This is intentionally shallow — see the "not handled" notes below
 * — but covers the common case of text placeholders and pictures, which is
 * what a scheduler's announcement/lyric/photo decks are made of.
 *
 * NOT handled (out of scope for v1): tables, speaker notes, grouped shapes
 * (`<p:grpSp>`), charts/SmartArt, slide-master/layout background text and
 * placeholders inherited rather than set on the slide itself, and shapes
 * with rotation/transform (text is extracted regardless of visual position).
 */

import {
  dirname,
  openPptxZip,
  parseXmlDocument,
  readZipText,
  relsPathFor,
  resolveZipPath,
} from "./ooxml";

const NS_P = "http://schemas.openxmlformats.org/presentationml/2006/main";
const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const NS_R =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_RELS = "http://schemas.openxmlformats.org/package/2006/relationships";

const INVALID_FILE_MESSAGE = "This doesn't look like a valid PowerPoint file.";

export type ParsedSlide = {
  text: string;
  images: { zipPath: string; mimeType: string }[];
};

/** Formats an `<img>` tag can actually render. PowerPoint also commonly
 * embeds EMF/WMF (pasted Office clip-art/vector art) and occasionally TIFF —
 * none of those render in a browser, so a slide whose only content is one
 * of those would otherwise "import successfully" as a permanently-broken
 * image with no indication anything went wrong. Returns null for anything
 * not in this list so the caller can drop it instead. */
function mimeTypeForPath(path: string): string | null {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return null;
  }
}

/** Reads a `.rels` part into a map of relationship id -> resolved zip path. */
async function parseRelationships(
  zip: Awaited<ReturnType<typeof openPptxZip>>,
  relsPath: string,
  baseDir: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const text = await readZipText(zip, relsPath);
  if (!text) return map;
  const doc = parseXmlDocument(text);
  const rels = doc.getElementsByTagNameNS(NS_RELS, "Relationship");
  for (let i = 0; i < rels.length; i++) {
    const rel = rels[i];
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");
    if (id && target) map.set(id, resolveZipPath(baseDir, target));
  }
  return map;
}

/** Ordered list of slide zip paths, per `<p:sldIdLst>` in presentation.xml. */
async function getOrderedSlidePaths(
  zip: Awaited<ReturnType<typeof openPptxZip>>
): Promise<string[]> {
  const presentationPath = "ppt/presentation.xml";
  const presentationXml = await readZipText(zip, presentationPath);
  if (!presentationXml) throw new Error(INVALID_FILE_MESSAGE);

  const relsMap = await parseRelationships(
    zip,
    relsPathFor(presentationPath),
    dirname(presentationPath)
  );
  if (relsMap.size === 0) throw new Error(INVALID_FILE_MESSAGE);

  const doc = parseXmlDocument(presentationXml);
  const sldIds = doc.getElementsByTagNameNS(NS_P, "sldId");
  // A well-formed presentation can legitimately have zero slides (all
  // deleted, or produced by some other tool) — that's not a corrupt file,
  // so it's not the same error as a genuinely malformed one below.
  if (sldIds.length === 0) return [];

  const paths: string[] = [];
  for (let i = 0; i < sldIds.length; i++) {
    const rId = sldIds[i].getAttributeNS(NS_R, "id");
    const target = rId ? relsMap.get(rId) : undefined;
    if (target) paths.push(target);
  }
  // Slides were declared but NONE resolved through the rels map — that's
  // an actually-broken/dangling-reference file, unlike the empty case above.
  if (paths.length === 0) throw new Error(INVALID_FILE_MESSAGE);
  return paths;
}

/**
 * Plain text for a slide: each `<p:sp>` shape's paragraphs are joined with
 * newlines (runs within a paragraph concatenated first), shapes with no text
 * are skipped, and the per-shape blocks are joined with newlines too.
 */
function extractSlideText(doc: Document): string {
  const shapeTexts: string[] = [];
  const shapes = doc.getElementsByTagNameNS(NS_P, "sp");
  for (let i = 0; i < shapes.length; i++) {
    const paragraphs = shapes[i].getElementsByTagNameNS(NS_A, "p");
    const lines: string[] = [];
    for (let j = 0; j < paragraphs.length; j++) {
      const runs = paragraphs[j].getElementsByTagNameNS(NS_A, "t");
      let line = "";
      for (let k = 0; k < runs.length; k++) {
        line += runs[k].textContent ?? "";
      }
      lines.push(line);
    }
    const shapeText = lines.join("\n").trim();
    if (shapeText) shapeTexts.push(shapeText);
  }
  return shapeTexts.join("\n");
}

/** Relationship ids referenced by `<p:pic>` / `<a:blip r:embed="...">`. */
function extractSlideImageRelIds(doc: Document): string[] {
  const relIds: string[] = [];
  const pics = doc.getElementsByTagNameNS(NS_P, "pic");
  for (let i = 0; i < pics.length; i++) {
    const blips = pics[i].getElementsByTagNameNS(NS_A, "blip");
    for (let j = 0; j < blips.length; j++) {
      const embed = blips[j].getAttributeNS(NS_R, "embed");
      if (embed) relIds.push(embed);
    }
  }
  return relIds;
}

/**
 * Parses a .pptx file into its ordered slides, each with plain text and any
 * embedded images (as zip paths + inferred mime types, ready to be read as
 * blobs on demand). Throws a clear, user-facing `Error` if the file doesn't
 * look like a valid PowerPoint package.
 */
export async function parsePptx(file: File): Promise<ParsedSlide[]> {
  let zip: Awaited<ReturnType<typeof openPptxZip>>;
  try {
    zip = await openPptxZip(file);
  } catch {
    throw new Error(INVALID_FILE_MESSAGE);
  }

  const slidePaths = await getOrderedSlidePaths(zip);
  const slides: ParsedSlide[] = [];

  for (const slidePath of slidePaths) {
    const slideXml = await readZipText(zip, slidePath);
    if (!slideXml) {
      slides.push({ text: "", images: [] });
      continue;
    }

    const doc = parseXmlDocument(slideXml);
    const text = extractSlideText(doc);
    const relIds = extractSlideImageRelIds(doc);

    let images: ParsedSlide["images"] = [];
    if (relIds.length > 0) {
      const relsMap = await parseRelationships(
        zip,
        relsPathFor(slidePath),
        dirname(slidePath)
      );
      images = relIds
        .map((id) => relsMap.get(id))
        .filter((path): path is string => Boolean(path))
        .map((path) => ({ zipPath: path, mimeType: mimeTypeForPath(path) }))
        .filter(
          (img): img is { zipPath: string; mimeType: string } =>
            img.mimeType !== null
        );
    }

    slides.push({ text, images });
  }

  return slides;
}
