import { describe, expect, it } from "vitest";

import { Certification, Education, isExpired, loadRegistry, ongoingStudies, selectCredentials } from "../src";
import { makeContent } from "./fixture";

const cert = (overrides: Record<string, unknown>) =>
  Certification.parse({ id: "cert", name: "Cert", issuer: "acme", issuedAt: "2025-01", ...overrides });
const study = (overrides: Record<string, unknown>) =>
  Education.parse({ id: "study", institution: "uni", kind: "course", title: { "en-us": "Study" }, ...overrides });

const TODAY = new Date("2026-11-23T12:00:00Z");
const ids = (list: ReturnType<typeof selectCredentials>) =>
  list.map((item) => (item.kind === "certification" ? item.certification.id : item.education.id));

describe("certification schema", () => {
  it("is not featured unless it says so", () => {
    expect(cert({}).featured).toBe(false);
    expect(cert({ featured: true }).featured).toBe(true);
  });

  it("loads from content/education/certifications and keeps the flag", () => {
    const root = makeContent({
      "education/certifications/az-900.yaml": {
        id: "az-900",
        name: "Azure Fundamentals",
        issuer: "acme",
        issuedAt: "2025-03",
        credentialUrl: "https://example.com/az-900",
        featured: true,
      },
    });
    expect(loadRegistry(root).getCertifications()).toEqual([expect.objectContaining({ id: "az-900", featured: true })]);
  });
});

describe("credential selection", () => {
  const certifications = [
    cert({ id: "old", issuedAt: "2023-05", featured: true }),
    cert({ id: "new", issuedAt: "2026-02", featured: true }),
    cert({ id: "plain", issuedAt: "2026-10" }),
    cert({ id: "expired", issuedAt: "2024-01", expiresAt: "2025-01", featured: true }),
  ];
  const education = [
    study({ id: "degree", kind: "degree", state: "completed", start: "2023-09", end: "2026-08" }),
    study({ id: "course", state: "completed", start: "2021-01", end: "2021-06" }),
    study({ id: "ongoing", state: "ongoing", start: "2026-09" }),
    study({ id: "undated" }),
  ];

  it("puts featured, valid certifications first, newest first, and fills up with completed studies", () => {
    expect(ids(selectCredentials({ education, certifications }, { today: TODAY }))).toEqual(["new", "old", "degree"]);
  });

  it("falls back to completed studies when no certification is featured", () => {
    expect(ids(selectCredentials({ education, certifications: [] }, { today: TODAY }))).toEqual(["degree", "course"]);
  });

  it("respects the limit", () => {
    expect(ids(selectCredentials({ education, certifications }, { today: TODAY, limit: 1 }))).toEqual(["new"]);
    expect(selectCredentials({ education, certifications }, { today: TODAY, limit: 0 })).toEqual([]);
  });

  it("knows when a certification has expired, at the precision of its date", () => {
    expect(isExpired(cert({ expiresAt: "2026-11" }), TODAY)).toBe(false);
    expect(isExpired(cert({ expiresAt: "2026-10" }), TODAY)).toBe(true);
    expect(isExpired(cert({}), TODAY)).toBe(false);
  });

  it("finds the studies in progress, the latest started first", () => {
    expect(ongoingStudies(education).map((item) => item.id)).toEqual(["ongoing"]);
    expect(
      ongoingStudies([study({ id: "a", state: "ongoing", start: "2025" }), study({ id: "b", state: "ongoing", start: "2026-01" })])
    ).toEqual([expect.objectContaining({ id: "b" }), expect.objectContaining({ id: "a" })]);
    expect(ongoingStudies([])).toEqual([]);
  });
});
