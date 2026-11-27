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
  rank: 1,
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

  it("requires the original language in the text, and an excerpt in the home page's top three", () => {
    const original = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ language: "zh-cn" }),
    });
    expect(original.errors.join()).toContain("original language");
    const featured = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ rank: 3, excerpt: undefined }),
    });
    expect(featured.errors.join()).toContain("need an excerpt");
    const below = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ rank: 4, excerpt: undefined }),
    });
    expect(below.errors).toEqual([]);
  });

  it("lets a draft wait without a relation, but not a published one", () => {
    const draft = check({
      "recommendations/ana.yaml": recommendation({ status: "draft", relation: undefined, rank: undefined, excerpt: undefined }),
    });
    expect(draft.errors).toEqual([]);
    const unranked = check({ "experiences/acme-dev.yaml": experience(), "recommendations/ana.yaml": recommendation({ rank: undefined }) });
    expect(unranked.errors.join()).toContain("needs a rank");
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

  it("rejects two recommendations with the same rank", () => {
    const result = check({
      "experiences/acme-dev.yaml": experience(),
      "recommendations/ana.yaml": recommendation({ rank: 1 }),
      "recommendations/bia.yaml": recommendation({ id: "bia", name: "Bia", rank: 1 }),
    });
    expect(result.errors.join()).toContain("rank: 1 is used twice");
  });

  it("serves public ones in the owner's rank, not by date, and drops links to hidden entities", () => {
    const registry = loadRegistry(
      makeContent({
        "experiences/acme-dev.yaml": experience({ status: "review" }),
        "recommendations/ana.yaml": recommendation({ rank: 2 }),
        "recommendations/bia.yaml": recommendation({ id: "bia", name: "Bia", date: "2024-01-02", rank: 1 }),
        "recommendations/cid.yaml": recommendation({ id: "cid", name: "Cid", status: "draft", rank: undefined }),
      })
    );
    const shown = registry.getRecommendations();
    expect(shown.map((item) => item.id)).toEqual(["bia", "ana"]);
    expect(shown[1]?.relation.experience).toBeUndefined();
  });
});
