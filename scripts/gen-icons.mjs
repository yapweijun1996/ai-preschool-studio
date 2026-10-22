// Rasterises the shared speech-bubble and leaf mark into the PWA / Apple touch icons.
// Usage: PW_CHROMIUM=/path/to/chrome node scripts/gen-icons.mjs   (or `npm run icons`)
// The generated PNGs are committed; rerun only when the artwork changes.
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url));
const MINT = '#E7F3EF';
const markSvg = readFileSync(fileURLToPath(new URL('../src/assets/brand/mark.svg', import.meta.url)), 'utf8');
const markContents = markSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1] ?? '';

/**
 * @param {number} size  output edge in px
 * @param {{ radius: number, safeScale: number }} o  tile radius and mark scale
 */
function tile(size, { radius, safeScale }) {
  const r = Math.round(size * radius);
  const markSize = Math.round(size * safeScale);
  const offset = Math.round((size - markSize) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${MINT}"/>
  <svg x="${offset}" y="${offset}" width="${markSize}" height="${markSize}" viewBox="0 0 32 32">${markContents}</svg>
</svg>`;
}

const icons = [
  { file: 'icon-192.png', size: 192, radius: 0.22, safeScale: 0.72 },
  { file: 'icon-512.png', size: 512, radius: 0.22, safeScale: 0.72 },
  // The mark stays within the central 80% safe zone for maskable icons.
  { file: 'icon-maskable-512.png', size: 512, radius: 0, safeScale: 0.72 },
  { file: 'apple-touch-icon.png', size: 180, radius: 0, safeScale: 0.72 }
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
    await page.locator('body > svg').screenshot({ path: outDir + icon.file, omitBackground: true });
    console.log('wrote public/icons/' + icon.file);
  }
} finally {
  await browser.close();
}
