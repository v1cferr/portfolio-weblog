import { Recommendation } from "@workspace/content";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { linkedinDate, mergeRecommendation, paragraphs, parseCsv, readRecommendations, slugOf } from "../src/lib/linkedin-import";

const HEADER = "First Name,Last Name,Company,Job Title,Text,Creation Date,Status";
const defaults = { url: "https://www.linkedin.com/in/tester/details/recommendations/", language: "pt-br" };

describe("LinkedIn CSV", () => {
  it("parses quoted fields with commas, doubled quotes, line breaks, CRLF and a BOM", () => {
    const csv = '﻿a,b\r\n"x, y","say ""hi""\nthere"\r\n';
    expect(parseCsv(csv)).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });

  it("turns names into file names", () => {
    expect(slugOf("Júlio César Raveli")).toBe("julio-cesar-raveli");
    expect(slugOf(" João  Victor Sitta ")).toBe("joao-victor-sitta");
  });

  it("reads UTC times as the owner's date (UTC-3)", () => {
    expect(linkedinDate("05/21/25, 12:15 AM")).toBe("2025-05-20");
    expect(linkedinDate("06/05/25, 01:33 AM")).toBe("2025-06-04");
    expect(linkedinDate("05/11/26, 01:06 PM")).toBe("2026-05-11");
    expect(linkedinDate("06/21/26, 10:16 PM")).toBe("2026-06-21");
    expect(() => linkedinDate("2025-05-21")).toThrow(/unexpected date/);
  });

  it("splits paragraphs the export joined with double spaces", () => {
    expect(paragraphs(" First, one.  Second.   Att,  Name ")).toEqual(["First, one.", "Second.", "Att,", "Name"]);
  });

  it("reads rows and rejects an unknown header or status", () => {
    const csv = `${HEADER}\nAna,Souza,,Dev,"Ótima, ""muito"" boa.  Recomendo.","05/21/25, 12:15 AM",HIDDEN\n`;
    expect(readRecommendations(csv)).toEqual([
      {
        id: "ana-souza",
        name: "Ana Souza",
        company: undefined,
        jobTitle: "Dev",
        text: ['Ótima, "muito" boa.', "Recomendo."],
        date: "2025-05-20",
        visibility: "private",
      },
    ]);
    expect(() => readRecommendations("Name,Text\n")).toThrow(/unexpected header/);
    expect(() => readRecommendations(`${HEADER}\nAna,Souza,,Dev,T,"05/21/25, 12:15 AM",GONE\n`)).toThrow(/unexpected status/);
  });
});

describe("merging into content", () => {
  const item = {
    id: "ana-souza",
    name: "Ana Souza",
    company: "Acme",
    jobTitle: "Dev",
    text: ["Ótima."],
    date: "2025-05-20",
    visibility: "public" as const,
  };
  const existing = [
    "# The owner's note stays.",
    "id: ana-souza",
    "name: Ana Souza",
    "jobTitle: Dev",
    "company: Acme",
    "relation:",
    "  kind: manager",
    "  label: { en-us: my manager }",
    "  organization: acme",
    'date: "2025-05-20"',
    "language: pt-br",
    "url: https://www.linkedin.com/in/tester/details/recommendations/",
    "featured: 1",
    "excerpt: { pt-br: Ótima., en-us: Great. }",
    "text:",
    "  pt-br:",
    "    - Ótima.",
    "  en-us:",
    "    - Great.",
    "",
  ].join("\n");

  it("adds a new one as a valid draft with a TODO for the owner", () => {
    const { yaml, change } = mergeRecommendation(undefined, item, defaults);
    expect(change).toBe("added");
    expect(yaml).toContain("TODO (owner)");
    const value = Recommendation.parse(parse(yaml));
    expect(value).toMatchObject({ status: "draft", text: { "pt-br": ["Ótima."] } });
    expect(value.featured).toBeUndefined();
    expect(value.relation).toBeUndefined();
  });

  it("leaves an unchanged entry byte for byte", () => {
    expect(mergeRecommendation(existing, item, defaults)).toEqual({ yaml: existing, change: "unchanged" });
  });

  it("refreshes synced fields, keeps the owner's, and flags translations when the text changes", () => {
    const fresh = { ...item, jobTitle: "Lead", company: undefined, text: ["Ótima, mesmo."], visibility: "private" as const };
    const { yaml, change } = mergeRecommendation(existing, fresh, defaults);
    expect(change).toBe("updated");
    const value = parse(yaml) as Record<string, unknown>;
    expect(value).toMatchObject({
      jobTitle: "Lead",
      visibility: "private",
      translationStale: true,
      featured: 1,
      relation: { kind: "manager", organization: "acme" },
      text: { "pt-br": ["Ótima, mesmo."], "en-us": ["Great."] },
    });
    expect(value.company).toBeUndefined();
    expect(yaml).toContain("# The owner's note stays.");
  });
});
