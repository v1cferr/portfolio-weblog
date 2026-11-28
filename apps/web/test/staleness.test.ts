import { describe, expect, it } from "vitest";

import { STALE_AFTER_DAYS, staleSince } from "../src/features/projects/staleness";

const now = new Date("2026-11-26T12:00:00Z");

describe("stale projects (2026-11-28)", () => {
  it("marks a project in progress with no push for more than three months", () => {
    expect(STALE_AFTER_DAYS).toBe(90);
    expect(staleSince("active", "2026-06-30T18:24:48Z", now)).toBe("2026-06");
    expect(staleSince("experimental", "2026-06-10T02:12:33Z", now)).toBe("2026-06");
  });

  it("leaves a recent push alone, however short the project's life", () => {
    expect(staleSince("experimental", "2026-10-18T01:35:40Z", now)).toBeUndefined();
    expect(staleSince("active", "2026-08-29T12:00:00Z", now)).toBeUndefined();
  });

  it("never marks a project the content calls finished, nor one without a repository", () => {
    for (const state of ["maintained", "stable", "paused", "historical", "archived"] as const) {
      expect(staleSince(state, "2023-06-13T14:33:43Z", now)).toBeUndefined();
    }
    expect(staleSince("active", undefined, now)).toBeUndefined();
    expect(staleSince("active", null, now)).toBeUndefined();
  });
});
