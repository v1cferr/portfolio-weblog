import { describe, expect, it } from "vitest";

import { excerptPieces, loadContent, loadRegistry, validateContent } from "../src";
import { experience, makeContent } from "./fixture";

const recommendation = (overrides: Record<string, unknown> = {}) => ({
  id: "ana",
  name: "Ana",
  jobTitle: "Gerente",
  company: "Acme",
  relation: { kind: "manager", label: { "pt-br": "minha gestora", "en-us": "my manager" }, organization: "acme", experience: "acme-dev" },
  date: "2025-05-20",
  language: "pt-br",
  url: "https://www.linkedin.com/in/tester/details/recommendations/",
  text: {
    "pt-br": ["Primeiro parágrafo, muito bom.", "Segundo parágrafo."],
    "en-us": ["First paragraph, very good.", "Second paragraph."],
  },
  excerpt: { "pt-br": "Primeiro parágrafo… Segundo parágrafo.", "en-us": "First paragraph, very good." },
  ...overrides,
});

function check(files: Record<string, unknown>) {
  const { content, issues } = loadContent(makeContent(files));
  const { errors, warnings } = validateContent(content);
  return { errors: [...issues, ...errors].map((i) => `${i.file}: ${i.message}`), warnings: warnings.map((w) => w.message) };
}

describe("recommendations", () => {
  it("accepts a recommendation tied to a job", () => {
    expect(check({ "experiences/acme-dev.yaml": experience(), "recommendations/ana.yaml": recommendation() }).errors).toEqual([]);
  });

  it("splits excerpts at ellipses", () => {
    expect(excerptPieces("…one part… another. ")).toEqual(["one part", "another."]);
  });

  it("rejects an excerpt that is not word for word in the text", () => {
    const result = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ excerpt: { "pt-br": "Primeiro parágrafo, excelente." } }),
    });
    expect(result.errors.join()).toContain("is not in the pt-br text word for word");
  });

  it("requires the original language in the text and an excerpt when featured", () => {
    const original = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ language: "zh-cn" }),
    });
    expect(original.errors.join()).toContain("original language");
    const featured = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ featured: 1, excerpt: undefined }),
    });
    expect(featured.errors.join()).toContain("needs an excerpt");
  });

  it("lets a draft wait without a relation, but not a published one", () => {
    const draft = check({ "recommendations/ana.yaml": recommendation({ status: "draft", relation: undefined, excerpt: undefined }) });
    expect(draft.errors).toEqual([]);
    const published = check({ "recommendations/ana.yaml": recommendation({ relation: undefined, excerpt: undefined }) });
    expect(published.errors.join()).toContain("needs a relation");
  });

  it("checks the relation's references", () => {
    const result = check({
      "recommendations/ana.yaml": recommendation({
        relation: { kind: "teacher", label: { "en-us": "my teacher" }, organization: "nowhere", education: "acme-dev" },
      }),
    });
    expect(result.errors.join()).toContain('relation.organization → "nowhere"');
    expect(result.errors.join()).toContain('relation.education → "acme-dev"');
  });

  it("rejects two recommendations in the same featured slot", () => {
    const result = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ featured: 1 }),
      "recommendations/bia.yaml": recommendation({ id: "bia", name: "Bia", featured: 1 }),
    });
    expect(result.errors.join()).toContain("featured: 1 is used twice");
  });

  it("serves public ones newest first and drops links to hidden entities", () => {
    const registry = loadRegistry(
      makeContent({
        "experiences/acme-dev.yaml": experience({ status: "review" }),
        "recommendations/ana.yaml": recommendation(),
        "recommendations/bia.yaml": recommendation({ id: "bia", name: "Bia", date: "2026-01-02" }),
        "recommendations/cid.yaml": recommendation({ id: "cid", name: "Cid", status: "draft" }),
      })
    );
    const shown = registry.getRecommendations();
    expect(shown.map((item) => item.id)).toEqual(["bia", "ana"]);
    expect(shown[1]?.relation.experience).toBeUndefined();
  });
});
