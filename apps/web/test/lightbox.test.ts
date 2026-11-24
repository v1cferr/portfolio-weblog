import { describe, expect, it } from "vitest";

import { galleryId, parsePhoto, photoValue } from "../src/components/lightbox/photo-param";

describe("the lightbox's ?photo= parameter", () => {
  it("counts from 1 in the URL and from 0 in code", () => {
    expect(photoValue("setup", 0)).toBe("setup-1");
    expect(parsePhoto("setup-1", "setup", 15)).toBe(0);
    expect(parsePhoto("setup-15", "setup", 15)).toBe(14);
  });

  it("ignores other galleries, even ones whose id starts the same", () => {
    expect(parsePhoto("fai-ufscar-2026-2", "fai", 3)).toBeNull();
    expect(parsePhoto("fai-ufscar-2026-2", "fai-ufscar-2026", 3)).toBe(1);
    expect(parsePhoto("media-1", "setup", 3)).toBeNull();
  });

  it("rejects positions out of range or malformed", () => {
    for (const value of ["setup-0", "setup-16", "setup-01", "setup-1.5", "setup-", "setup", null]) {
      expect(parsePhoto(value, "setup", 15)).toBeNull();
    }
  });

  it("keeps gallery ids to URL- and layout-safe characters", () => {
    expect(galleryId("figure-arch desk.v2")).toBe("figure-arch_desk_v2");
  });
});
