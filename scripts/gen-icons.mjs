// Rasterises the "AP" monogram tile into the PWA / Apple touch icons in public/icons/.
// Usage: PW_CHROMIUM=/path/to/chrome node scripts/gen-icons.mjs   (or `npm run icons`)
// The generated PNGs are committed; rerun only when the artwork changes.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url));
const BRAND = '#167D68';

/**
 * @param {number} size  output edge in px
 * @param {{ radius: number, text: number }} o  corner radius and font size as fractions of size
 */
function tile(size, { radius, text }) {
  const r = Math.round(size * radius);
  const fs = Math.round(size * text);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BRAND}"/>
  <text x="50%" y="50%" dy="0.36em" text-anchor="middle" fill="#FFFFFF"
    font-family="Inter, 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif" font-weight="700"
    font-size="${fs}" letter-spacing="${Math.round(fs * -0.02)}">AP</text>
</svg>`;
}

const icons = [
  // "any" icons: rounded tile on transparent corners.
  { file: 'icon-192.png', size: 192, radius: 0.22, text: 0.42 },
  { file: 'icon-512.png', size: 512, radius: 0.22, text: 0.42 },
  // Maskable: full-bleed background, monogram inside the 80% safe zone (platform applies its own mask).
  { file: 'icon-maskable-512.png', size: 512, radius: 0, text: 0.3 },
  // iOS draws its own rounded mask and shows transparency as black, so this one is a full square.
  { file: 'apple-touch-icon.png', size: 180, radius: 0, text: 0.4 }
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const icon of icons) {
    await page.setViewportSize({ width: icon.size, height: icon.size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${tile(icon.size, icon)}</body></html>`
    );
    await page.locator('svg').screenshot({ path: outDir + icon.file, omitBackground: true });
    console.log('wrote public/icons/' + icon.file);
  }
} finally {
  await browser.close();
}
