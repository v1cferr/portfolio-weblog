import { describe, expect, it } from "vitest";

import { ASCII_RAMP, asciiArt } from "../src/ascii";

/** A row of three cells: black, mid grey, white. */
const greys = [0, 0, 0, 128, 128, 128, 255, 255, 255];

const text = (rows: ReturnType<typeof asciiArt>) => rows.map((row) => row.map((segment) => segment.text).join(""));

describe("asciiArt", () => {
  it("inks dark pixels on a light page and light pixels on a dark one", () => {
    const [light] = text(asciiArt(greys, 3, 1, { theme: "light" }));
    const [dark] = text(asciiArt(greys, 3, 1, { theme: "dark" }));
    expect(light?.[0]).toBe(ASCII_RAMP.at(-1));
    expect(light?.[2]).toBe(" ");
    expect(dark?.[0]).toBe(" ");
    expect(dark?.[2]).toBe(ASCII_RAMP.at(-1));
  });

  it("keeps one glyph per pixel, row by row", () => {
    const rows = text(asciiArt([...greys, ...greys], 3, 2, { theme: "light" }));
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.length === 3)).toBe(true);
  });

  it("gives vivid cells an accent colour and leaves the rest to the ink", () => {
    // A strong red between white and black, so it lands mid-ramp and gets a glyph.
    const pixels = [255, 255, 255, 200, 30, 30, 0, 0, 0];
    const [row] = asciiArt(pixels, 3, 1, { theme: "light" });
    expect(row?.map((segment) => segment.color)).toEqual([undefined, "#d02020", undefined]);
  });

  it("does not colour near-black cells, however saturated", () => {
    const [row] = asciiArt([60, 0, 0, 255, 255, 255], 2, 1, { theme: "light" });
    expect(row?.every((segment) => segment.color === undefined)).toBe(true);
  });

  it("rejects a buffer smaller than the grid", () => {
    expect(() => asciiArt([0, 0, 0], 2, 1, { theme: "dark" })).toThrow(/expected 6 values/);
  });
});
