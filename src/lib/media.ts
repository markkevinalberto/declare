/**
 * A media plan item's file list. Only names and types are stored server-side
 * — the files themselves stay in the presenter machine's browser storage and
 * are never uploaded, so other devices can see what the item contains and
 * prompt their operator to attach the same files locally.
 */
export type MediaFileMeta = { name: string; type: "image" | "video" };
export type MediaConfig = { files: MediaFileMeta[] };

export function normalizeMediaConfig(raw: unknown): MediaConfig {
  const value = (raw ?? {}) as Partial<MediaConfig>;
  const files = Array.isArray(value.files)
    ? value.files
        .filter((f) => f && typeof f.name === "string")
        .map((f) => ({
          name: f.name.slice(0, 200),
          type: f.type === "video" ? ("video" as const) : ("image" as const),
        }))
    : [];
  return { files };
}
