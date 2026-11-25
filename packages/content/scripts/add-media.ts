/**
 * Prepares an image for the site and prints the YAML to reference it:
 *
 *   pnpm media:add <source image> <destination under apps/web/public>
 *   pnpm media:add ~/Photos/team.jpg career/fai-ufscar/team.jpg
 *
 * The output is rotated according to its EXIF orientation, resized to at
 * most 2400 px on the longest side (never enlarged), and written without any
 * metadata (EXIF, GPS, XMP, IPTC). content:check rejects images that still
 * have metadata.
 *
 * The file is a master, not what visitors download: next/image re-encodes it
 * per device, so it keeps as much detail as is reasonable. The destination's
 * extension picks the encoding:
 *
 * - .jpg/.jpeg for photos: JPEG quality 92 (mozjpeg) with full-resolution
 *   colour (4:4:4), so edges and small text do not smear.
 * - .png for screenshots and documents with text: lossless.
 * - .webp/.avif still work, but they are lossy with halved colour resolution,
 *   and the site re-encodes them a second time; prefer .jpg for photos.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { findContentRoot } from "../src";

const [source, destination] = process.argv.slice(2);
if (source === undefined || destination === undefined) {
  console.error("usage: pnpm media:add <source image> <destination under apps/web/public>");
  process.exit(1);
}
if (!/\.(?:jpe?g|png|webp|avif)$/i.test(destination) || destination.includes("..")) {
  console.error("the destination must be a relative .jpg, .png, .webp or .avif path");
  process.exit(1);
}

const publicDir = path.join(findContentRoot(), "..", "apps", "web", "public");
const target = path.join(publicDir, destination);
mkdirSync(path.dirname(target), { recursive: true });

/** Longest side of a master: the lightbox (80vw) on a 1440 px wide 2x screen asks for about 2300 px. */
const MAX_SIZE = 2400;

// sharp writes no metadata unless asked to; rotate() bakes in the orientation first.
const resized = sharp(source).rotate().resize({ width: MAX_SIZE, height: MAX_SIZE, fit: "inside", withoutEnlargement: true });
const extension = path.extname(destination).toLowerCase();
const encoded =
  extension === ".png"
    ? resized.png({ compressionLevel: 9, effort: 10 })
    : extension === ".jpg" || extension === ".jpeg"
      ? resized.jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
      : resized; // .webp/.avif: sharp's defaults for the format
const info = await encoded.toFile(target);

console.warn(`Wrote ${path.relative(process.cwd(), target)} (${String(info.width)}x${String(info.height)}, no metadata). Reference it with:

media:
  - src: /${destination.replace(/^\/+/, "")}
    width: ${String(info.width)}
    height: ${String(info.height)}
    alt: { en-us: Describe what the image shows, pt-br: Descreva o que a imagem mostra }
    caption: { en-us: Optional caption }`);
