/**
 * Prepares an image for the site and prints the YAML to reference it:
 *
 *   pnpm media:add <source image> <destination under apps/web/public>
 *   pnpm media:add ~/Photos/team.jpg career/fai-ufscar/team.webp
 *
 * The output is rotated according to its EXIF orientation, resized to at
 * most 1600 px on the longest side, and written without any metadata (EXIF,
 * GPS, XMP, IPTC). content:check rejects images that still have metadata.
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

// sharp writes no metadata unless asked to; rotate() bakes in the orientation first.
const info = await sharp(source).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).toFile(target);

console.warn(`Wrote ${path.relative(process.cwd(), target)} (${String(info.width)}x${String(info.height)}, no metadata). Reference it with:

media:
  - src: /${destination.replace(/^\/+/, "")}
    alt: { en-us: Describe what the image shows, pt-br: Descreva o que a imagem mostra }
    caption: { en-us: Optional caption }`);
