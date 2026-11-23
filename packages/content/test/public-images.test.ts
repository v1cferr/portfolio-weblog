import { readdirSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { findContentRoot } from "../src";

const publicDir = path.join(findContentRoot(), "..", "apps", "web", "public");

function rasterImages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return rasterImages(file);
    return /\.(?:jpe?g|png|webp|avif)$/i.test(entry.name) ? [file] : [];
  });
}

/**
 * content:check covers the images that content references; this also covers
 * the ones it cannot see, such as images embedded in posts. Photos taken with
 * a phone carry GPS coordinates and device details in EXIF.
 */
describe("images under apps/web/public", () => {
  it.each(rasterImages(publicDir).map((file) => [path.relative(publicDir, file), file]))(
    "%s has no EXIF, XMP or IPTC metadata",
    async (_, file) => {
      const metadata = await sharp(file).metadata();
      expect({ exif: metadata.exif !== undefined, xmp: metadata.xmp !== undefined, iptc: metadata.iptc !== undefined }).toEqual({
        exif: false,
        xmp: false,
        iptc: false,
      });
    }
  );
});
