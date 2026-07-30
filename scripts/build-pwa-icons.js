// Rasterizes the web app's actual source icon (single source of truth —
// same file the Electron installer icon is built from) into the PNG sizes
// a PWA manifest needs. Re-run this whenever icon.svg changes.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const SVG_PATH = path.join(__dirname, "..", "src", "app", "icon.svg");
const OUT_DIR = path.join(__dirname, "..", "public", "icons");
const SIZES = [192, 512];

async function main() {
  const svg = fs.readFileSync(SVG_PATH);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const size of SIZES) {
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(outPath);
    console.log(`wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
