import { describe, expect, it } from "vitest";

import { ContentValidationError, daysSince, loadNow, loadNowContent } from "../src";
import { makeContent } from "./fixture";

const entry = (date: string, overrides: Record<string, unknown> = {}) => ({
  date,
  items: { "en-us": [`Update of ${date}`] },
  ...overrides,
});

describe("now log", () => {
  it("loads every update newest first, and the plans", () => {
    const root = makeContent({
      "now/2026-01-10.yaml": entry("2026-01-10"),
      "now/2026-11-23.yaml": entry("2026-11-23", { note: { "en-us": "Hi" }, place: "Somewhere" }),
      "now/2025-06-01.yaml": entry("2025-06-01"),
      "now/next.yaml": { updatedAt: "2026-11-23", items: { "en-us": ["Ship it"] } },
    });
    const log = loadNow(root);
    expect(log.entries.map((e) => e.date)).toEqual(["2026-11-23", "2026-01-10", "2025-06-01"]);
    expect(log.entries[0]).toMatchObject({ note: { "en-us": "Hi" }, place: "Somewhere" });
    expect(log.next?.items["en-us"]).toEqual(["Ship it"]);
  });

  it("is empty without a now/ folder", () => {
    expect(loadNow(makeContent({}))).toEqual({ entries: [], next: undefined });
  });

  it("hides drafts and private updates", () => {
    const root = makeContent({
      "now/2026-11-23.yaml": entry("2026-11-23", { status: "draft" }),
      "now/2026-11-01.yaml": entry("2026-11-01", { visibility: "private" }),
      "now/2026-10-01.yaml": entry("2026-10-01"),
      "now/next.yaml": { updatedAt: "2026-11-23", status: "review", items: { "en-us": ["Later"] } },
    });
    const log = loadNow(root);
    expect(log.entries.map((e) => e.date)).toEqual(["2026-10-01"]);
    expect(log.next).toBeUndefined();
  });

  it("rejects a date that does not match the file name, bad names and empty bullets", () => {
    const root = makeContent({
      "now/2026-11-23.yaml": entry("2026-11-22"),
      "now/latest.yaml": entry("2026-11-23"),
      "now/2026-02-30.yaml": entry("2026-02-30"),
      "now/2026-11-01.yaml": { date: "2026-11-01", items: { "en-us": [] } },
    });
    const messages = loadNowContent(root).issues.map((issue) => `${issue.file}: ${issue.message}`);
    expect(messages).toEqual([
      expect.stringMatching(/2026-02-30\.yaml: date: not a real calendar date/),
      expect.stringMatching(/2026-11-01\.yaml: items: at least one locale/),
      expect.stringMatching(/2026-11-23\.yaml: date "2026-11-22" must match/),
      expect.stringMatching(/latest\.yaml: now entries are named/),
    ]);
    expect(() => loadNow(root)).toThrow(ContentValidationError);
  });

  it("counts whole days in UTC and never goes negative", () => {
    expect(daysSince("2026-11-23", new Date("2026-11-23T23:59:00Z"))).toBe(0);
    expect(daysSince("2026-08-25", new Date("2026-11-23T01:00:00Z"))).toBe(90);
    expect(daysSince("2026-12-01", new Date("2026-11-23T00:00:00Z"))).toBe(0);
  });
});
