import sharp from "sharp";

// Capacitor's splash pipeline "cover"-scales this square source to fill
// whatever the device's portrait canvas is, then center-crops. For a square
// source, the visible window's width, as a fraction of the canvas, equals
// the phone's own aspect ratio (width/height) — as narrow as ~0.45 on a
// tall modern phone. Two earlier attempts got cut off by spanning too much
// of the canvas width (the raw 1024x500 feature graphic used directly, and
// a copy of its full-width layout). This keeps the icon+wordmark+tagline
// block centered and comfortably under ~35% of the canvas width so it
// survives even a narrow crop, in both portrait and landscape.
const SIZE = 2732;
const CENTER = SIZE / 2;

// Same mark geometry as src/app/icon.svg and scripts/gen-feature-graphic.mjs
// (a 156px-badge reference), scaled up to this badge's size — reusing the
// proven proportions instead of re-guessing a transform.
const BADGE_SIZE = 300;
const BADGE_REF = 156;
const BADGE_SCALE = BADGE_SIZE / BADGE_REF;
const MARK_PATH =
  "M 40,40 H 125 C 215,40 265,100 265,150 C 265,200 215,260 125,260 H 85 L 40,300 Z M 120,95 L 210,150 L 120,205 Z";

const GAP = 36;
const NAME_FONT_SIZE = 130;
// "Declare" measured empirically at this font/weight; used only to center
// the icon+wordmark row as a block, not for exact glyph layout.
const NAME_WIDTH_ESTIMATE = 540;
const TAGLINE_FONT_SIZE = 42;

const ROW_WIDTH = BADGE_SIZE + GAP + NAME_WIDTH_ESTIMATE;
const ROW_LEFT = CENTER - ROW_WIDTH / 2;
const ROW_CENTER_Y = CENTER - 100;

const BADGE_LEFT = Math.round(ROW_LEFT);
const BADGE_TOP = Math.round(ROW_CENTER_Y - BADGE_SIZE / 2);
const NAME_X = Math.round(ROW_LEFT + BADGE_SIZE + GAP);
const NAME_Y = Math.round(ROW_CENTER_Y + NAME_FONT_SIZE * 0.35);

// Tagline sits directly under the wordmark (left-aligned to it, matching
// the feature graphic's styling) on two lines rather than one — a single
// line at a legible size is wider than the safe crop budget and is
// exactly what spilled off-screen in the original banner.
const TAGLINE_Y1 = NAME_Y + 72;
const TAGLINE_Y2 = TAGLINE_Y1 + 56;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="g1" cx="82%" cy="10%" r="55%">
      <stop offset="0%" stop-color="#245BFF" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#245BFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="10%" cy="92%" r="55%">
      <stop offset="0%" stop-color="#30D5FF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#30D5FF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#245BFF"/>
      <stop offset="100%" stop-color="#30D5FF"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="#0b1626"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g1)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g2)"/>

  <rect x="${BADGE_LEFT}" y="${BADGE_TOP}" width="${BADGE_SIZE}" height="${BADGE_SIZE}" rx="${40 * BADGE_SCALE}" fill="url(#badge)"/>
  <g transform="translate(${BADGE_LEFT + 36 * BADGE_SCALE} ${BADGE_TOP + 33 * BADGE_SCALE}) scale(${0.32 * BADGE_SCALE})">
    <path fill="#ffffff" fill-rule="evenodd" d="${MARK_PATH}"/>
  </g>

  <text x="${NAME_X}" y="${NAME_Y}" text-anchor="start" font-family="Arial, sans-serif" font-size="${NAME_FONT_SIZE}" font-weight="700" letter-spacing="-2" fill="#ffffff">Declare</text>
  <text x="${NAME_X}" y="${TAGLINE_Y1}" text-anchor="start" font-family="Arial, sans-serif" font-size="${TAGLINE_FONT_SIZE}" fill="rgba(255,255,255,0.72)">Schedule volunteers.</text>
  <text x="${NAME_X}" y="${TAGLINE_Y2}" text-anchor="start" font-family="Arial, sans-serif" font-size="${TAGLINE_FONT_SIZE}" fill="rgba(255,255,255,0.72)">Run your church team.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("resources/splash.png");
console.log(`row width ${ROW_WIDTH}px (${((ROW_WIDTH / SIZE) * 100).toFixed(1)}% of canvas)`);
