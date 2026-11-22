import { describe, expect, it } from "vitest";

import { atkinsonDither } from "../src";

describe("atkinsonDither", () => {
  it("keeps pure black and white as they are", () => {
    expect([...atkinsonDither([0, 255, 0, 255], 2, 2)]).toEqual([0, 1, 0, 1]);
  });

  it("dithers mid-gray into a mix of both", () => {
    const bits = atkinsonDither(new Array(64).fill(128), 8, 8);
    expect(bits).toHaveLength(64);
    const light = bits.filter((bit) => bit === 1).length;
    expect(light).toBeGreaterThan(16);
    expect(light).toBeLessThan(48);
  });
});
