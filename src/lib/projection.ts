export const FONT_OPTIONS = [
  { value: "var(--font-heading)", label: "Default (Heading)" },
  { value: "var(--font-sans)", label: "Default (Body)" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
  { value: "Impact, Charcoal, sans-serif", label: "Impact" },
  { value: "'Comic Sans MS', 'Comic Sans', cursive", label: "Comic Sans" },
] as const;

const FONT_VALUES = new Set<string>(FONT_OPTIONS.map((f) => f.value));

export type ProjectionSettings = {
  fontFamily: string;
  /** Multiplier on the base slide font size. */
  fontScale: number;
  textColor: string;
  bold: boolean;
  italic: boolean;
  /** Dark drop shadow behind text for readability over backgrounds. */
  shadow: boolean;
  /** Outline around each letter — helps text pop off busy backgrounds. */
  stroke: boolean;
  strokeColor: string;
  /** Stroke thickness in em (scales with text size). */
  strokeWidth: number;
  bgType: "none" | "image" | "video";
  bgUrl: string;
};

export const DEFAULT_PROJECTION_SETTINGS: ProjectionSettings = {
  fontFamily: "var(--font-heading)",
  fontScale: 1,
  textColor: "#ffffff",
  bold: false,
  italic: false,
  shadow: true,
  stroke: false,
  strokeColor: "#000000",
  strokeWidth: 0.03,
  bgType: "none",
  bgUrl: "",
};

export function normalizeProjectionSettings(
  raw: unknown
): ProjectionSettings {
  const value = (raw ?? {}) as Partial<ProjectionSettings>;
  return {
    fontFamily:
      typeof value.fontFamily === "string" && value.fontFamily
        ? value.fontFamily
        : DEFAULT_PROJECTION_SETTINGS.fontFamily,
    fontScale:
      typeof value.fontScale === "number" &&
      value.fontScale >= 0.5 &&
      value.fontScale <= 2
        ? value.fontScale
        : DEFAULT_PROJECTION_SETTINGS.fontScale,
    textColor:
      typeof value.textColor === "string" && value.textColor
        ? value.textColor
        : DEFAULT_PROJECTION_SETTINGS.textColor,
    bold: Boolean(value.bold),
    italic: Boolean(value.italic),
    shadow: value.shadow === undefined ? true : Boolean(value.shadow),
    stroke: Boolean(value.stroke),
    strokeColor:
      typeof value.strokeColor === "string" && value.strokeColor
        ? value.strokeColor
        : DEFAULT_PROJECTION_SETTINGS.strokeColor,
    strokeWidth:
      typeof value.strokeWidth === "number" &&
      value.strokeWidth >= 0.005 &&
      value.strokeWidth <= 0.12
        ? value.strokeWidth
        : DEFAULT_PROJECTION_SETTINGS.strokeWidth,
    bgType:
      value.bgType === "image" || value.bgType === "video"
        ? value.bgType
        : "none",
    bgUrl: typeof value.bgUrl === "string" ? value.bgUrl : "",
  };
}

/**
 * Per-song text-format overrides, edited from the presenter (not the song
 * library editor) — font, size, color, bold, italic, and shadow. Only the
 * background stays on the org-wide theme, since it isn't song-specific.
 */
export type SongProjectionFormat = Partial<
  Omit<ProjectionSettings, "bgType" | "bgUrl">
>;

export function normalizeSongFormat(raw: unknown): SongProjectionFormat {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Partial<ProjectionSettings>;
  const format: SongProjectionFormat = {};
  if (typeof value.fontFamily === "string" && FONT_VALUES.has(value.fontFamily)) {
    format.fontFamily = value.fontFamily;
  }
  if (
    typeof value.fontScale === "number" &&
    value.fontScale >= 0.5 &&
    value.fontScale <= 2
  ) {
    format.fontScale = value.fontScale;
  }
  if (typeof value.textColor === "string" && value.textColor) {
    format.textColor = value.textColor;
  }
  if (typeof value.bold === "boolean") format.bold = value.bold;
  if (typeof value.italic === "boolean") format.italic = value.italic;
  if (typeof value.shadow === "boolean") format.shadow = value.shadow;
  if (typeof value.stroke === "boolean") format.stroke = value.stroke;
  if (typeof value.strokeColor === "string" && value.strokeColor) {
    format.strokeColor = value.strokeColor;
  }
  if (
    typeof value.strokeWidth === "number" &&
    value.strokeWidth >= 0.005 &&
    value.strokeWidth <= 0.12
  ) {
    format.strokeWidth = value.strokeWidth;
  }
  return format;
}

/** Resolve a song's effective text style: its overrides, then the theme. */
export function resolveSongFormat(
  theme: ProjectionSettings,
  songFormat: SongProjectionFormat | null | undefined
): ProjectionSettings {
  return { ...theme, ...(songFormat ?? {}) };
}
