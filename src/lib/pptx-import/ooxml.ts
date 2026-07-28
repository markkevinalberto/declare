/**
 * Low-level OOXML/zip helpers shared by the PPTX importer. A .pptx file is a
 * standard zip archive of XML parts (per the ECMA-376 spec) — these helpers
 * open that archive and read individual parts, either as text (for the XML
 * parts) or as binary (for embedded media). Everything runs client-side —
 * the file never leaves the browser.
 */

import JSZip from "jszip";

/** Opens a .pptx file (or its raw bytes) as a JSZip archive. */
export async function openPptxZip(file: File | ArrayBuffer): Promise<JSZip> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  return JSZip.loadAsync(buffer);
}

/** Reads a zip entry's text content (UTF-8), or `null` if it doesn't exist. */
export async function readZipText(
  zip: JSZip,
  path: string
): Promise<string | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  return entry.async("text");
}

/**
 * Reads a zip entry's binary content as a `Blob`, typed with the given mime
 * type (used for embedded images) — or `null` if the entry doesn't exist.
 */
export async function readZipBlob(
  zip: JSZip,
  path: string,
  mimeType: string
): Promise<Blob | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  const buffer = await entry.async("arraybuffer");
  return new Blob([buffer], { type: mimeType });
}

/**
 * Parses an XML part's text into a DOM `Document` using the browser's native
 * `DOMParser` — simpler and more robust than hand-rolling an XML parser.
 * Throws if the browser reports a parse error.
 */
export function parseXmlDocument(text: string): Document {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Malformed XML inside this PowerPoint file.");
  }
  return doc;
}

/** Returns the `_rels/*.rels` part path that describes a given zip entry. */
export function relsPathFor(entryPath: string): string {
  const slash = entryPath.lastIndexOf("/");
  const dir = slash === -1 ? "" : entryPath.slice(0, slash);
  const name = slash === -1 ? entryPath : entryPath.slice(slash + 1);
  return `${dir ? `${dir}/` : ""}_rels/${name}.rels`;
}

/** The directory portion of a zip entry path (no trailing slash). */
export function dirname(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "" : path.slice(0, slash);
}

/**
 * Resolves a relationship `Target` (which is relative to `baseDir`, per the
 * OPC spec) to an absolute zip entry path, handling `../` segments.
 */
export function resolveZipPath(baseDir: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const stack = baseDir.split("/").filter(Boolean);
  for (const part of target.split("/").filter(Boolean)) {
    if (part === "..") stack.pop();
    else if (part !== ".") stack.push(part);
  }
  return stack.join("/");
}
