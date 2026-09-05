import sharp from "sharp";

// Capacitor's splash pipeline "cover"-scales this square source to fill
// whatever the device's portrait canvas is, then center-crops. For a square
// source, the visible window's width, as a fraction of the canvas, equals
// the phone's own aspect ratio (width/height) — as narrow as ~0.45 on a
// tall modern phone. Two earlier layouts got cut off because they spanned
// too much of the canvas width (the raw 1024x500 feature graphic, and a
// first icon-left/text-right attempt sized like that banner). This keeps
// the icon+wordmark row and the tagline each centered and comfortably
// under ~35% of the canvas width, so they survive even a narrow crop.
const SIZE = 2732;
const CENTER = SIZE / 2;

const ICON_SIZE = 300;
const GAP = 36;
const NAME_FONT_SIZE = 130;
// "Declare" measured empirically at this font/weight; used only to center
// the icon+wordmark row as a block, not for exact glyph layout.
const NAME_WIDTH_ESTIMATE = 540;

const ROW_WIDTH = ICON_SIZE + GAP + NAME_WIDTH_ESTIMATE;
const ROW_LEFT = CENTER - ROW_WIDTH / 2;
const ROW_CENTER_Y = CENTER - 60;

const ICON_LEFT = Math.round(ROW_LEFT);
const ICON_TOP = Math.round(ROW_CENTER_Y - ICON_SIZE / 2);
const NAME_X = Math.round(ROW_LEFT + ICON_SIZE + GAP);
const NAME_Y = Math.round(ROW_CENTER_Y + NAME_FONT_SIZE * 0.35);

const TAGLINE_Y1 = Math.round(ROW_CENTER_Y + ICON_SIZE / 2 + 90);
const TAGLINE_Y2 = TAGLINE_Y1 + 55;

const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="g1" cx="82%" cy="10%" r="55%">
      <stop offset="0%" stop-color="#245BFF" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#245BFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="10%" cy="92%" r="55%">
      <stop offset="0%" stop-color="#30D5FF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#30D5FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="#0b1626"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g1)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g2)"/>

  <text x="${NAME_X}" y="${NAME_Y}" text-anchor="start" font-family="Arial, sans-serif" font-size="${NAME_FONT_SIZE}" font-weight="700" letter-spacing="-2" fill="#ffffff">Declare</text>
  <text x="${CENTER}" y="${TAGLINE_Y1}" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="rgba(255,255,255,0.72)">Schedule volunteers.</text>
  <text x="${CENTER}" y="${TAGLINE_Y2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="rgba(255,255,255,0.72)">Run your church team.</text>
</svg>`;

const icon = await sharp("resources/icon.png")
  .resize(ICON_SIZE, ICON_SIZE, { fit: "contain" })
  .toBuffer();

await sharp(Buffer.from(background))
  .composite([{ input: icon, left: ICON_LEFT, top: ICON_TOP }])
  .png()
  .toFile("resources/splash.png");

console.log(`row width ${ROW_WIDTH}px (${((ROW_WIDTH / SIZE) * 100).toFixed(1)}% of canvas)`);
