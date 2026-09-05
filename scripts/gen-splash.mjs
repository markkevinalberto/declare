import sharp from "sharp";

// Capacitor's splash pipeline "cover"-scales this square source to fill
// whatever the device's portrait canvas is, then center-crops. For a square
// source, that means the visible window's width, as a fraction of the
// canvas, equals the phone's own aspect ratio (width/height) — as narrow as
// ~0.45 on a tall modern phone. A horizontal icon-left/text-right lockup
// (tried twice: the raw 1024x500 feature graphic, then a custom horizontal
// composition) needs far more than 45% of the canvas width and gets cut off
// on exactly those phones. Stacking everything vertically keeps the widest
// single line safely under that budget regardless of scaling.
const SIZE = 2732;
const CENTER = SIZE / 2;
const ICON_SIZE = 480;

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

  <text x="${CENTER}" y="${CENTER + 380}" text-anchor="middle" font-family="Arial, sans-serif" font-size="130" font-weight="700" letter-spacing="-2" fill="#ffffff">Declare</text>
  <text x="${CENTER}" y="${CENTER + 445}" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="rgba(255,255,255,0.72)">Schedule volunteers.</text>
  <text x="${CENTER}" y="${CENTER + 495}" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="rgba(255,255,255,0.72)">Run your church team.</text>
</svg>`;

const icon = await sharp("resources/icon.png")
  .resize(ICON_SIZE, ICON_SIZE, { fit: "contain" })
  .toBuffer();

await sharp(Buffer.from(background))
  .composite([
    {
      input: icon,
      left: Math.round(CENTER - ICON_SIZE / 2),
      top: Math.round(CENTER - 280 - ICON_SIZE / 2),
    },
  ])
  .png()
  .toFile("resources/splash.png");

console.log("done");
