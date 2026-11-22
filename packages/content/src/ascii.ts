/**
 * Turns an RGB image into ASCII art for one theme. Each cell becomes a glyph
 * whose density follows the pixel's luminance, so the glyphs are the ink:
 * on a light page dark pixels get dense glyphs, on a dark page light pixels
 * do. Strongly saturated cells (a logo, a red sign) keep their colour as an
 * accent; everything else is left to the theme's ink (currentColor).
 *
 * Pure: pixels in, rows out, no image library. Used by scripts/build-avatar.ts.
 */

/** A run of glyphs; `color` is a hex accent, or undefined for the theme's ink. */
export type AsciiSegment = { text: string; color?: string };
export type AsciiRow = AsciiSegment[];

export const ASCII_RAMP = " .,:;-~=+*o#%@";

export type AsciiOptions = {
  theme: "light" | "dark";
  ramp?: string;
  /** Saturation (0–1) above which a cell keeps its colour. */
  accentSaturation?: number;
  /** Minimum brightest channel (0–255) for an accent, so near-black cells stay ink. */
  accentValue?: number;
  /**
   * Tone curve on the stretched luminance. Above 1 darkens midtones (more ink
   * on a light page: pale letters on a white sign show up); below 1 lifts
   * shadows (more ink on a dark page: a black jacket keeps its shape).
   * Defaults to 1.15 for light and 0.6 for dark.
   */
  gamma?: number;
};

export function asciiArt(rgb: ArrayLike<number>, cols: number, rows: number, options: AsciiOptions): AsciiRow[] {
  const ramp = options.ramp ?? ASCII_RAMP;
  const accentSaturation = options.accentSaturation ?? 0.42;
  const accentValue = options.accentValue ?? 90;
  const gamma = options.gamma ?? (options.theme === "light" ? 1.15 : 0.6);
  const count = cols * rows;
  if (rgb.length < count * 3) throw new Error(`asciiArt: expected ${String(count * 3)} values, got ${String(rgb.length)}`);

  // Stretch luminance to the full range, so a dark jacket still shows its folds.
  const luminance = new Float32Array(count);
  let lowest = 1;
  let highest = 0;
  for (let i = 0; i < count; i++) {
    const value = (0.2126 * (rgb[i * 3] ?? 0) + 0.7152 * (rgb[i * 3 + 1] ?? 0) + 0.0722 * (rgb[i * 3 + 2] ?? 0)) / 255;
    luminance[i] = value;
    lowest = Math.min(lowest, value);
    highest = Math.max(highest, value);
  }
  const span = Math.max(0.001, highest - lowest);

  const result: AsciiRow[] = [];
  for (let y = 0; y < rows; y++) {
    const row: AsciiRow = [];
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const level = Math.pow(((luminance[i] ?? 0) - lowest) / span, gamma);
      const density = options.theme === "dark" ? level : 1 - level;
      const glyph = ramp[Math.min(ramp.length - 1, Math.floor(density * ramp.length))] ?? " ";
      const color =
        glyph === " " ? undefined : accent(rgb[i * 3] ?? 0, rgb[i * 3 + 1] ?? 0, rgb[i * 3 + 2] ?? 0, accentSaturation, accentValue);
      const last = row.at(-1);
      // A space has no colour, so it joins whichever run it follows.
      if (last !== undefined && (last.color === color || glyph === " ")) last.text += glyph;
      else row.push(color === undefined ? { text: glyph } : { text: glyph, color });
    }
    result.push(row);
  }
  return result;
}

/** The cell's colour, quantised to steps of 16 so neighbours merge into runs, or undefined when it is not vivid. */
function accent(r: number, g: number, b: number, minSaturation: number, minValue: number): string | undefined {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation <= minSaturation || max <= minValue) return undefined;
  const hex = (v: number) => (Math.min(255, Math.round(v / 16) * 16) | 0).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
