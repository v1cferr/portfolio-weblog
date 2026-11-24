/**
 * Atkinson dithering: turns a greyscale image into 1-bit pixels. Each pixel
 * becomes on (lit) or off (shadow) at a threshold, and 1/8 of the rounding
 * error goes to each of six neighbours ahead of it: (1,0), (2,0), (-1,1),
 * (0,1), (1,1) and (0,2). Only 6/8 of the error is carried, so flat areas
 * settle into clean black or white instead of noise: the classic Macintosh
 * look.
 *
 * Pure: values in, bits out, no image library. Used by scripts/build-avatar.ts.
 */

/** Neighbours that receive 1/8 of the error each, as [dx, dy]. */
const ATKINSON: readonly (readonly [number, number])[] = [
  [1, 0],
  [2, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [0, 2],
];

/**
 * Dithers `grey` (one 0–255 value per pixel, row by row) to 1 bit per pixel.
 * Returns 1 where the pixel is lit (light in the photo) and 0 where it is in
 * shadow. `threshold` is a fraction of white (0.5 by default).
 */
export function atkinsonDither(grey: ArrayLike<number>, width: number, height: number, threshold = 0.5): Uint8Array {
  const count = width * height;
  if (grey.length < count) throw new Error(`atkinsonDither: expected ${String(count)} values, got ${String(grey.length)}`);
  const level = Float32Array.from({ length: count }, (_, i) => (grey[i] ?? 0) / 255);
  const bits = new Uint8Array(count);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const old = level[i] ?? 0;
      const lit = old >= threshold ? 1 : 0;
      bits[i] = lit;
      const share = (old - lit) / 8;
      for (const [dx, dy] of ATKINSON) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny >= height) continue;
        const j = ny * width + nx;
        level[j] = (level[j] ?? 0) + share;
      }
    }
  }
  return bits;
}

/**
 * An alpha mask from dithered bits, scaled up by `scale` with nearest
 * neighbour: one byte per output pixel, 255 (opaque) where `bits` equals
 * `ink` and 0 (transparent) elsewhere.
 */
export function ditherMask(bits: ArrayLike<number>, width: number, height: number, ink: 0 | 1, scale = 1): Uint8Array {
  const outWidth = width * scale;
  const alpha = new Uint8Array(outWidth * height * scale);
  for (let y = 0; y < height * scale; y++) {
    const source = Math.floor(y / scale) * width;
    for (let x = 0; x < outWidth; x++) {
      alpha[y * outWidth + x] = bits[source + Math.floor(x / scale)] === ink ? 255 : 0;
    }
  }
  return alpha;
}
