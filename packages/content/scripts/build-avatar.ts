/**
 * Builds the profile avatar from the photo and its subject mask:
 *
 *   pnpm avatar:build
 *
 * Inputs: apps/web/public/images/profile.jpg (the photo, untouched) and
 * apps/web/assets/profile-mask.png (the subject's alpha mask, same size).
 * Outputs, in apps/web/public/images/:
 *   avatar-cutout.webp       the photo without its background, lightly lifted
 *   avatar-dither-dark.png   1-bit Atkinson dither for dark mode (light ink)
 *   avatar-dither-light.png  the same for light mode (dark ink)
 *
 * The mask was made locally with rembg and the BiRefNet-portrait model (MIT),
 * so the face never left the machine. To redo it after changing the photo:
 *
 *   nix shell --impure --expr 'with import (builtins.getFlake "nixpkgs") {};
 *     python3.withPackages (ps: [ ps.rembg ps.pillow ])' --command python3 -c \
 *     "from rembg import new_session, remove; from PIL import Image;
 *      remove(Image.open('apps/web/public/images/profile.jpg'),
 *      session=new_session('birefnet-portrait'), only_mask=True)
 *      .save('apps/web/assets/profile-mask.png')"
 *
 * sharp writes no metadata, so the outputs pass content:check.
 */
import path from "node:path";

import sharp from "sharp";

import { findContentRoot } from "../src";

const web = path.join(findContentRoot(), "..", "apps", "web");
const photo = path.join(web, "public", "images", "profile.jpg");
const maskFile = path.join(web, "assets", "profile-mask.png");
const out = (name: string) => path.join(web, "public", "images", name);

// Head and shoulders, square, around the subject (in source pixels).
const crop = { left: 230, top: 200, width: 760, height: 760 };
const DITHER_SIZE = 300;
const INK = { dark: [0xc0, 0xca, 0xf5], light: [0x2a, 0x2e, 0x45] } as const;

const lifted = sharp(photo).extract(crop).modulate({ brightness: 1.08, saturation: 1.04 }).linear(1.06, -6);
const mask = await sharp(maskFile).extract(crop).toColourspace("b-w").raw().toBuffer();

// The cutout: lifted photo with the mask as alpha, at a size the hero needs twice over.
const { data: rgb } = await lifted.clone().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(crop.width * crop.height * 4);
for (let i = 0; i < crop.width * crop.height; i++) {
  rgba[i * 4] = rgb[i * 3] ?? 0;
  rgba[i * 4 + 1] = rgb[i * 3 + 1] ?? 0;
  rgba[i * 4 + 2] = rgb[i * 3 + 2] ?? 0;
  rgba[i * 4 + 3] = mask[i] ?? 0;
}
await sharp(rgba, { raw: { width: crop.width, height: crop.height, channels: 4 } })
  .resize(600, 600)
  .webp({ quality: 82, alphaQuality: 90 })
  .toFile(out("avatar-cutout.webp"));

// The dither: Atkinson error diffusion at a low resolution, shown pixelated.
const size = DITHER_SIZE;
const gray = Float32Array.from(await lifted.clone().grayscale().normalise({ lower: 2, upper: 98 }).resize(size, size).raw().toBuffer());
const smallMask = await sharp(maskFile).extract(crop).toColourspace("b-w").resize(size, size).raw().toBuffer();
const at = (x: number, y: number) => y * size + x;
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const old = gray[at(x, y)] ?? 0;
    const value = old > 128 ? 255 : 0;
    const error = (old - value) / 8;
    gray[at(x, y)] = value;
    for (const [dx, dy] of [
      [1, 0],
      [2, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
      [0, 2],
    ] as const) {
      if (x + dx >= 0 && x + dx < size && y + dy < size) gray[at(x + dx, y + dy)] = (gray[at(x + dx, y + dy)] ?? 0) + error;
    }
  }
}

for (const theme of ["dark", "light"] as const) {
  const [r, g, b] = INK[theme];
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    // Dark mode inks the light parts of the photo; light mode inks the dark parts.
    const light = (gray[i] ?? 0) >= 128;
    const inked = (smallMask[i] ?? 0) > 128 && (theme === "dark" ? light : !light);
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = inked ? 255 : 0;
  }
  await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
    .png({ palette: true, compressionLevel: 9 })
    .toFile(out(`avatar-dither-${theme}.png`));
}

console.warn("Wrote avatar-cutout.webp, avatar-dither-dark.png and avatar-dither-light.png in apps/web/public/images/");
