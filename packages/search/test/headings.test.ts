import { describe, expect, it } from "vitest";

import { atxHeading } from "../src";

describe("atxHeading", () => {
  it("reads levels 1 to 3 and drops a closing sequence", () => {
    expect(atxHeading("# Title")).toBe("Title");
    expect(atxHeading("### Deep title ###")).toBe("Deep title");
    expect(atxHeading("##\tTabbed  ")).toBe("Tabbed");
  });

  it("keeps a '#' that is part of the text", () => {
    expect(atxHeading("## Why C#")).toBe("Why C#");
  });

  it("rejects non-headings", () => {
    expect(atxHeading("#### Too deep")).toBeUndefined();
    expect(atxHeading("#hashtag")).toBeUndefined();
    expect(atxHeading("## ")).toBeUndefined();
    expect(atxHeading("plain text")).toBeUndefined();
  });

  it("stays fast on long runs of spaces (no polynomial backtracking)", () => {
    const line = `# a${" ".repeat(50_000)}b${" ".repeat(50_000)}`;
    const start = performance.now();
    expect(atxHeading(line)).toMatch(/^a +b$/);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
