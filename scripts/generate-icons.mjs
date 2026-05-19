// One-off icon generator for the PWA manifest. Renders a stylised
// 漢 character on the theme-color background, at 192×192 (standard),
// 512×512 (standard), and a 512×512 maskable variant with safe-area
// padding. Output goes into `public/icons/` and is committed.
//
// Run with: node scripts/generate-icons.mjs
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "..", "public", "icons");

const THEME = "#7E1F4F"; // burgundy
const FG = "#FAF5EF"; // off-white

function svg({ size, safeMargin = 0 }) {
  // The glyph 漢 (traditional) scales nicely. We size it relative to the
  // safe area so the maskable variant doesn't get the character clipped.
  const usable = size - safeMargin * 2;
  const fontSize = usable * 0.62;
  // Manually offset baseline so the glyph looks centred — empirical.
  const cy = size / 2 + fontSize * 0.32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${THEME}"/>
    <text x="50%" y="${cy}" font-family="serif" font-size="${fontSize}" font-weight="700"
          fill="${FG}" text-anchor="middle" dominant-baseline="alphabetic">漢</text>
  </svg>`;
}

async function emit(name, sizePx, safeMargin = 0) {
  const buf = Buffer.from(svg({ size: sizePx, safeMargin }));
  await sharp(buf).png().toFile(resolve(OUT, name));
  // eslint-disable-next-line no-console
  console.log(`Wrote ${name} (${sizePx}×${sizePx})`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await emit("icon-192.png", 192);
  await emit("icon-512.png", 512);
  // Maskable: at least 10% of each edge should be safe area so OS-side
  // adaptive masks don't crop the glyph.
  await emit("icon-maskable-512.png", 512, 64);

  // Favicons — same glyph, browser-tab sizes. Drop into public/ root so
  // index.html can reference them at "/favicon-32.png" etc.
  const publicRoot = resolve(HERE, "..", "public");
  await sharp(Buffer.from(svg({ size: 32 })))
    .png()
    .toFile(resolve(publicRoot, "favicon-32.png"));
  await sharp(Buffer.from(svg({ size: 16 })))
    .png()
    .toFile(resolve(publicRoot, "favicon-16.png"));
  // 180×180 is what iOS Home-screen install pulls when no manifest icon
  // is acceptable. Lives at /apple-touch-icon.png by convention.
  await sharp(Buffer.from(svg({ size: 180 })))
    .png()
    .toFile(resolve(publicRoot, "apple-touch-icon.png"));
  // eslint-disable-next-line no-console
  console.log("Wrote favicon-16.png, favicon-32.png, apple-touch-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
