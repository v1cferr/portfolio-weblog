import { describe, expect, it } from "vitest";

import { normalizePath, pageScope, parsePlace, parseStored, pickAnchor, scrollRatio, uiStateKey } from "../src/lib/ui-state";

describe("per-tab UI state keys", () => {
  it("namespaces every key under v1c:ui:", () => {
    expect(uiStateKey("explorer:open")).toBe("v1c:ui:explorer:open");
  });

  it("scopes a page's element by its locale-less path, so every language shares it", () => {
    expect(uiStateKey(pageScope("/about", "read-all:julio"))).toBe("v1c:ui:/about:read-all:julio");
    expect(pageScope("/about/", "x")).toBe(pageScope("/about", "x"));
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/")).toBe("/");
  });
});

describe("parseStored", () => {
  it("reads JSON of the fallback's type", () => {
    expect(parseStored("true", false)).toBe(true);
    expect(parseStored('{"a":true}', {})).toEqual({ a: true });
    expect(parseStored("[1]", [] as number[])).toEqual([1]);
  });

  it("falls back on a missing, corrupt or mistyped value", () => {
    expect(parseStored(null, false)).toBe(false);
    expect(parseStored("{oops", false)).toBe(false);
    expect(parseStored('"yes"', false)).toBe(false);
    expect(parseStored("null", {})).toEqual({});
    expect(parseStored("[]", {})).toEqual({});
  });
});

describe("the reading place kept across a language switch", () => {
  it("round-trips a saved place and clamps the ratio", () => {
    expect(parsePlace(JSON.stringify({ path: "/setup", anchorId: "mousepad", offset: 90, ratio: 0.4 }))).toEqual({
      path: "/setup",
      anchorId: "mousepad",
      offset: 90,
      ratio: 0.4,
    });
    expect(parsePlace(JSON.stringify({ path: "/", offset: 0, ratio: 3 }))).toEqual({ path: "/", offset: 0, ratio: 1 });
  });

  it("ignores anything malformed", () => {
    expect(parsePlace(null)).toBeUndefined();
    expect(parsePlace("nope")).toBeUndefined();
    expect(parsePlace(JSON.stringify({ path: "/", offset: "1", ratio: 0 }))).toBeUndefined();
  });

  it("measures how far down the page the reader is", () => {
    expect(scrollRatio(500, 2000, 1000)).toBe(0.5);
    expect(scrollRatio(0, 800, 1000)).toBe(0);
    expect(scrollRatio(5000, 2000, 1000)).toBe(1);
  });

  it("picks the anchored element closest above the header line", () => {
    const candidates = [
      { id: "section", top: -2000 },
      { id: "card-1", top: -300 },
      { id: "card-2", top: 60 },
      { id: "card-3", top: 700 },
    ];
    expect(pickAnchor(candidates, 80)?.id).toBe("card-2");
    expect(pickAnchor(candidates, 0)?.id).toBe("card-1");
    expect(pickAnchor([{ id: "below", top: 400 }], 80)).toBeUndefined();
  });
});
