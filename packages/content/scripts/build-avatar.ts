/**
 * Builds the hero avatar's 1-bit portrait from the hero photo:
 *
 *   pnpm avatar:build
 *
 * Input: apps/web/public/images/hero.jpg (the owner alone, head to waist,
 * cut from a team photo on 2026-11-23 with the ID badge blurred; no
 * metadata).
 * Output: two alpha masks in apps/web/public/images/, ink opaque and the rest
 * transparent, so the page paints them in the theme's ink with CSS
 * (features/profile/avatar.tsx) and reveals the photo through a lens around
 * the pointer:
 *
 * - hero-dither-dark.png: the lit pixels. On a dark page the light parts of
 *   the photo are what the ink draws.
 * - hero-dither-light.png: the shadow pixels, the exact complement. On a
 *   light page the dark parts are what the ink draws.
 *
 * Both come from one dither, so the two themes show the same portrait, each
 * as a positive image. Chosen on 2026-11-24 ("P1a · 1-bit Atkinson") over
 * Bayer, mosaic, halftone and LED renders; it replaces the ASCII art of
 * 2026-11-22.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { atkinsonDither, ditherMask, findContentRoot } from "../src";

/**
 * Dither cells across. 192 lands on exactly 2 CSS pixels per cell in the
 * desktop hero (24rem), close to the ~180 of the reference render.
 */
const COLUMNS = 192;
/**
 * Each cell is stored as SCALE × SCALE pixels (nearest neighbour), so the
 * browser downsamples a sharp mask instead of blurring a tiny one up: masks
 * ignore image-rendering in most engines. Same-row repeats compress to almost
 * nothing in PNG.
 */
const SCALE = 4;
/** Contrast boost after normalising, before dithering (the reference render's values). */
const CONTRAST = { multiply: 1.15, offset: -12 } as const;
const THRESHOLD = 0.5;

const web = path.join(findContentRoot(), "..", "apps", "web");
const images = path.join(web, "public", "images");
const photo = path.join(images, "hero.jpg");

const { width, height } = await sharp(photo).metadata();
const rows = Math.round(COLUMNS * (height / width));
const grey = await sharp(photo)
  .greyscale()
  .normalise()
  .linear(CONTRAST.multiply, CONTRAST.offset)
  .resize(COLUMNS, rows, { fit: "fill", kernel: "lanczos3" })
  .raw()
  .toBuffer();
const bits = atkinsonDither(grey, COLUMNS, rows, THRESHOLD);

for (const [theme, ink] of [
  ["dark", 1],
  ["light", 0],
] as const) {
  const alpha = ditherMask(bits, COLUMNS, rows, ink, SCALE);
  // Black ink with the mask as alpha; the colour is irrelevant, only alpha masks.
  const rgba = Buffer.alloc(alpha.length * 4);
  alpha.forEach((value, i) => (rgba[i * 4 + 3] = value));
  const png = await sharp(rgba, { raw: { width: COLUMNS * SCALE, height: rows * SCALE, channels: 4 } })
    .png({ palette: true, colours: 2, dither: 0, compressionLevel: 9, effort: 10 })
    .toBuffer();
  const target = path.join(images, `hero-dither-${theme}.png`);
  await writeFile(target, png);
  console.warn(
    `Wrote ${path.relative(process.cwd(), target)} (${String(COLUMNS)} × ${String(rows)} cells at ${String(SCALE)}×, ${String(png.length)} bytes)`
  );
}
