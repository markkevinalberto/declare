import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <radialGradient id="g1" cx="82%" cy="-10%" r="60%">
      <stop offset="0%" stop-color="#245BFF" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#245BFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="-10%" cy="115%" r="60%">
      <stop offset="0%" stop-color="#30D5FF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#30D5FF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#245BFF"/>
      <stop offset="100%" stop-color="#30D5FF"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="#0b1626"/>
  <rect width="1024" height="500" fill="url(#g1)"/>
  <rect width="1024" height="500" fill="url(#g2)"/>
  <rect x="352" y="172" width="156" height="156" rx="40" fill="url(#badge)"/>
  <g transform="translate(388 205) scale(0.32)">
    <path fill="#ffffff" fill-rule="evenodd" d="M 40,40 H 125 C 215,40 265,100 265,150 C 265,200 215,260 125,260 H 85 L 40,300 Z M 120,95 L 210,150 L 120,205 Z"/>
  </g>
  <text x="548" y="272" font-family="Arial, sans-serif" font-size="76" font-weight="700" letter-spacing="-1.5" fill="#ffffff">Declare</text>
  <text x="548" y="316" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.72)">Schedule volunteers. Run your church team.</text>
</svg>`;

await sharp(Buffer.from(svg))
  .flatten({ background: "#0b1626" }) // Play Store requires 24-bit, no alpha
  .jpeg({ quality: 95 })
  .toFile("play-store-assets/feature-graphic.jpg");

console.log("done");
