import { describe, expect, it } from "vitest";

import { atkinsonDither, ditherMask } from "../src/dither";

const mean = (bits: ArrayLike<number>) => Array.from(bits).reduce((sum, bit) => sum + bit, 0) / bits.length;

describe("atkinsonDither", () => {
  it("keeps black black and white white", () => {
    expect(Array.from(atkinsonDither([0, 0, 0, 0], 2, 2))).toEqual([0, 0, 0, 0]);
    expect(Array.from(atkinsonDither([255, 255, 255, 255], 2, 2))).toEqual([1, 1, 1, 1]);
  });

  it("lights roughly as many pixels as the grey asks for", () => {
    const size = 32;
    const grey = new Array<number>(size * size).fill(Math.round(0.25 * 255));
    // Atkinson carries only 6/8 of the error, so a flat tone lands near, not on, its level.
    expect(mean(atkinsonDither(grey, size, size))).toBeGreaterThan(0.15);
    expect(mean(atkinsonDither(grey, size, size))).toBeLessThan(0.35);
  });

  it("follows the threshold", () => {
    const mid = [128];
    expect(atkinsonDither(mid, 1, 1, 0.4)[0]).toBe(1);
    expect(atkinsonDither(mid, 1, 1, 0.6)[0]).toBe(0);
  });

  it("refuses too few values", () => {
    expect(() => atkinsonDither([0, 0], 2, 2)).toThrow(/expected 4/);
  });
});

describe("ditherMask", () => {
  const bits = [1, 0, 0, 1];

  it("makes the chosen ink opaque and the rest transparent", () => {
    expect(Array.from(ditherMask(bits, 2, 2, 1))).toEqual([255, 0, 0, 255]);
    expect(Array.from(ditherMask(bits, 2, 2, 0))).toEqual([0, 255, 255, 0]);
  });

  it("scales up with nearest neighbour", () => {
    expect(Array.from(ditherMask([1, 0], 2, 1, 1, 2))).toEqual([255, 255, 0, 0, 255, 255, 0, 0]);
  });
});
