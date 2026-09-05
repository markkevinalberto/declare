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
const SAFE_WIDTH = SIZE * 0.42; // stay well inside the ~45% worst case

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

  <rect x="${CENTER - 220}" y="${CENTER - 340}" width="440" height="440" rx="110" fill="url(#badge)"/>
  <g transform="translate(${CENTER - 320} ${CENTER - 250}) scale(0.9)">
    <path fill="#ffffff" fill-rule="evenodd" d="M 40,40 H 125 C 215,40 265,100 265,150 C 265,200 215,260 125,260 H 85 L 40,300 Z M 120,95 L 210,150 L 120,205 Z"/>
  </g>

  <text x="${CENTER}" y="${CENTER + 210}" text-anchor="middle" font-family="Arial, sans-serif" font-size="130" font-weight="700" letter-spacing="-2" fill="#ffffff">Declare</text>
  <!-- Two shorter lines, each independently centered, instead of one long
       line — keeps every line's own width under the safe budget rather
       than relying on the full tagline fitting in one pass. -->
  <text x="${CENTER}" y="${CENTER + 275}" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="rgba(255,255,255,0.72)">Schedule volunteers.</text>
  <text x="${CENTER}" y="${CENTER + 325}" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="rgba(255,255,255,0.72)">Run your church team.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("resources/splash.png");
console.log(`done (safe width budget: ${SAFE_WIDTH}px of ${SIZE}px canvas)`);
