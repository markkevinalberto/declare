// Rasterizes the web app's actual source icon (single source of truth —
// never a separately-maintained copy) into a proper multi-resolution
// Windows .ico for the app window and NSIS installer/uninstaller.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const pngToIco = require("png-to-ico");

const SVG_PATH = path.join(__dirname, "..", "..", "src", "app", "icon.svg");
const OUT_DIR = path.join(__dirname, "..", "build");
const OUT_PATH = path.join(OUT_DIR, "icon.ico");
const SIZES = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  const svg = fs.readFileSync(SVG_PATH);
  const pngBuffers = await Promise.all(
    SIZES.map((size) => sharp(svg).resize(size, size).png().toBuffer())
  );
  const ico = await pngToIco(pngBuffers);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, ico);
  console.log(`wrote ${OUT_PATH} (${ico.length} bytes, ${SIZES.length} sizes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
