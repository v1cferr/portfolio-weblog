/**
 * Atkinson dithering: turns a grayscale image into 1-bit, spreading only 6/8
 * of each pixel's error to its neighbours, which keeps highlights clean. Used
 * for the avatar (scripts/build-avatar.ts) and for album covers in the web
 * app. Pure: pixels in, bits out, no image library.
 *
 * Returns one byte per pixel: 1 where the source is light, 0 where it is dark.
 */
export function atkinsonDither(gray: ArrayLike<number>, width: number, height: number): Uint8Array {
  const values = Float32Array.from(gray);
  const bits = new Uint8Array(width * height);
  const spread = [
    [1, 0],
    [2, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [0, 2],
  ] as const;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const old = values[index] ?? 0;
      const light = old > 128;
      bits[index] = light ? 1 : 0;
      const error = (old - (light ? 255 : 0)) / 8;
      for (const [dx, dy] of spread) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny < height) values[ny * width + nx] = (values[ny * width + nx] ?? 0) + error;
      }
    }
  }
  return bits;
}
