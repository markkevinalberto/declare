import sharp from "sharp";

// Capacitor's recommended splash source size is a 2732x2732 square — it gets
// center-cropped differently per device aspect ratio, so the logo lockup
// stays inside a safe central zone rather than the full canvas.
const SIZE = 2732;

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
  <rect x="${SIZE / 2 - 220}" y="${SIZE / 2 - 340}" width="440" height="440" rx="110" fill="url(#badge)"/>
  <g transform="translate(${SIZE / 2 - 100} ${SIZE / 2 - 250}) scale(0.9)">
    <path fill="#ffffff" fill-rule="evenodd" d="M 40,40 H 125 C 215,40 265,100 265,150 C 265,200 215,260 125,260 H 85 L 40,300 Z M 120,95 L 210,150 L 120,205 Z"/>
  </g>
  <text x="${SIZE / 2}" y="${SIZE / 2 + 210}" text-anchor="middle" font-family="Arial, sans-serif" font-size="130" font-weight="700" letter-spacing="-2" fill="#ffffff">Declare</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("resources/splash.png");
console.log("done");
