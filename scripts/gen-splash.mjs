import sharp from "sharp";

// Capacitor's splash pipeline "cover"-scales this square source to fill
// whatever the device's portrait canvas is, then center-crops. For a square
// source, the visible window's width, as a fraction of the canvas, equals
// the phone's own aspect ratio (width/height) — as narrow as ~0.45 on a
// tall modern phone. Earlier attempts got cut off by spanning too much of
// the canvas width; this keeps the icon+wordmark+tagline block centered
// and comfortably under ~35% of the canvas width so it survives even a
// narrow crop, in both portrait and landscape.
const SIZE = 2732;
const CENTER = SIZE / 2;

// Renders text alone on a padded transparent canvas and trims it, so
// layout math uses the real rendered ink width instead of a guessed
// character-count estimate (a guess that was previously off by ~100px and
// threw the whole row's horizontal centering off).
async function measureTextWidth(text, { fontSize, weight = 400, letterSpacing = 0 }) {
  const pad = fontSize * 2;
  const w = fontSize * text.length * 1.5 + pad * 2;
  const h = fontSize * 3;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="${pad}" y="${h / 2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="#fff">${text}</text>
  </svg>`;
  const { info } = await sharp(Buffer.from(svg)).trim().toBuffer({ resolveWithObject: true });
  return info.width;
}

// Same mark geometry as src/app/icon.svg and scripts/gen-feature-graphic.mjs
// (a 156px-badge reference), scaled up to this badge's size.
const BADGE_SIZE = 300;
const BADGE_REF = 156;
const BADGE_SCALE = BADGE_SIZE / BADGE_REF;
const MARK_PATH =
  "M 40,40 H 125 C 215,40 265,100 265,150 C 265,200 215,260 125,260 H 85 L 40,300 Z M 120,95 L 210,150 L 120,205 Z";

const GAP = 36;
const NAME_FONT_SIZE = 130;
const NAME_LETTER_SPACING = -2;
const TAGLINE_FONT_SIZE = 42;
const TAGLINE_LINE1 = "Schedule volunteers.";
const TAGLINE_LINE2 = "Run your church team.";

const nameWidth = await measureTextWidth("Declare", {
  fontSize: NAME_FONT_SIZE,
  weight: 700,
  letterSpacing: NAME_LETTER_SPACING,
});
const taglineWidth = Math.max(
  await measureTextWidth(TAGLINE_LINE1, { fontSize: TAGLINE_FONT_SIZE }),
  await measureTextWidth(TAGLINE_LINE2, { fontSize: TAGLINE_FONT_SIZE })
);

const ROW_WIDTH = BADGE_SIZE + GAP + Math.max(nameWidth, taglineWidth);
const ROW_LEFT = CENTER - ROW_WIDTH / 2;

// Bottom-align the badge with the last tagline line (matching the
// reference: badge bottom ~= tagline baseline + descender) so they read as
// sitting on a shared flat surface, instead of the badge floating above a
// tagline hanging below it. That makes the badge itself — top to bottom —
// the full height of the block, so centering the badge vertically centers
// the whole lockup.
const BADGE_TOP = Math.round(CENTER - BADGE_SIZE / 2);
const BADGE_BOTTOM = BADGE_TOP + BADGE_SIZE;
const BADGE_LEFT = Math.round(ROW_LEFT);
const NAME_X = Math.round(ROW_LEFT + BADGE_SIZE + GAP);

const TAGLINE_LINE_HEIGHT = TAGLINE_FONT_SIZE * 1.35;
const TAGLINE_DESCENDER_ALLOWANCE = Math.round(TAGLINE_FONT_SIZE * 0.22);
const NAME_TO_TAGLINE_GAP = 55;

const TAGLINE_Y2 = BADGE_BOTTOM - TAGLINE_DESCENDER_ALLOWANCE;
const TAGLINE_Y1 = Math.round(TAGLINE_Y2 - TAGLINE_LINE_HEIGHT);
const NAME_Y = Math.round(TAGLINE_Y1 - NAME_TO_TAGLINE_GAP);

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

  <text x="${NAME_X}" y="${NAME_Y}" text-anchor="start" font-family="Arial, sans-serif" font-size="${NAME_FONT_SIZE}" font-weight="700" letter-spacing="${NAME_LETTER_SPACING}" fill="#ffffff">Declare</text>
  <text x="${NAME_X}" y="${TAGLINE_Y1}" text-anchor="start" font-family="Arial, sans-serif" font-size="${TAGLINE_FONT_SIZE}" fill="rgba(255,255,255,0.72)">${TAGLINE_LINE1}</text>
  <text x="${NAME_X}" y="${TAGLINE_Y2}" text-anchor="start" font-family="Arial, sans-serif" font-size="${TAGLINE_FONT_SIZE}" fill="rgba(255,255,255,0.72)">${TAGLINE_LINE2}</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("resources/splash.png");
console.log(
  `row width ${ROW_WIDTH.toFixed(0)}px (${((ROW_WIDTH / SIZE) * 100).toFixed(1)}% of canvas), name width ${nameWidth}px`
);
