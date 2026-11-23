import { describe, expect, it } from "vitest";

import { loadContent, loadRegistry, parseFrontmatter, validateContent } from "../src";
import { experience, makeContent, post, project } from "./fixture";

function check(files: Record<string, unknown>) {
  const { content, issues } = loadContent(makeContent(files));
  const { errors, warnings } = validateContent(content);
  return { errors: [...issues, ...errors].map((i) => `${i.file}: ${i.message}`), warnings: warnings.map((w) => w.message) };
}

describe("schemas", () => {
  it("accepts a valid tree", () => {
    const result = check({ "experiences/acme-dev.yaml": experience(), "projects/hub.yaml": project() });
    expect(result.errors).toEqual([]);
  });

  it("rejects impossible calendar dates", () => {
    const result = check({ "experiences/acme-dev.yaml": experience({ positions: [{ title: { "en-us": "Dev" }, start: "2023-02-30" }] }) });
    expect(result.errors.join()).toContain("not a real calendar date");
  });

  it("reads unquoted years and dates from YAML as partial dates", () => {
    const yaml = "id: dated\ntitle: Dated\nsummary:\n  en-us: S\nstate: stable\ncategory: personal\nstartedAt: 2020\nendedAt: 2021-03-04\n";
    expect(check({ "projects/dated.yaml": yaml }).errors).toEqual([]);
  });

  it("rejects unknown fields instead of ignoring typos", () => {
    const result = check({ "projects/hub.yaml": project({ techs: ["typescript"] }) });
    expect(result.errors.join()).toMatch(/techs/);
  });

  it("requires the file name to match the id", () => {
    const result = check({ "projects/other-name.yaml": project() });
    expect(result.errors.join()).toContain('must match the file name "other-name"');
  });

  it("requires a profile", () => {
    const result = check({ "profile/profile.yaml": undefined });
    expect(result.errors.join()).toContain("the profile is required");
  });

  it("rejects malformed ids", () => {
    const result = check({ "projects/Hub_1.yaml": project({ id: "Hub_1" }) });
    expect(result.errors.join()).toContain("kebab-case");
  });
});

describe("case studies", () => {
  const decision = (overrides: Record<string, unknown> = {}) => ({
    title: { "en-us": "Storage" },
    chosen: { "en-us": "YAML in Git" },
    alternatives: { "en-us": ["A CMS"] },
    why: { "en-us": "Reviewable diffs." },
    cost: { "en-us": "No editor UI." },
    adr: "https://github.com/acme/hub/blob/main/docs/decisions/0001.md",
    ...overrides,
  });
  const caseStudy = (overrides: Record<string, unknown> = {}) => ({
    problem: { "en-us": "Data stuck in components.", "pt-br": "Dados presos aos componentes." },
    role: { "en-us": "Solo" },
    decisions: [decision()],
    ...overrides,
  });

  it("accepts a case study with only the required fields", () => {
    expect(check({ "projects/hub.yaml": project({ caseStudy: caseStudy() }) }).errors).toEqual([]);
  });

  it("accepts a full case study", () => {
    const full = caseStudy({
      outcome: { "en-us": "Shipped." },
      motivation: { "en-us": "Why." },
      constraints: { "en-us": ["Free tier"] },
      nonGoals: { "en-us": ["A CMS"] },
      approach: { "en-us": "How." },
      quality: { "en-us": ["Typecheck"] },
      howBuilt: { "en-us": "Built with an AI assistant." },
      lessons: { "en-us": ["One"] },
      next: { "en-us": ["Two"] },
      adrs: "https://github.com/acme/hub/tree/main/docs/decisions",
    });
    expect(check({ "projects/hub.yaml": project({ caseStudy: full }) }).errors).toEqual([]);
  });

  it("requires the problem", () => {
    const { problem: _, ...withoutProblem } = caseStudy();
    expect(check({ "projects/hub.yaml": project({ caseStudy: withoutProblem }) }).errors.join()).toMatch(/caseStudy\.problem/);
  });

  it("allows at most three decisions", () => {
    const result = check({ "projects/hub.yaml": project({ caseStudy: caseStudy({ decisions: [1, 2, 3, 4].map(() => decision()) }) }) });
    expect(result.errors.join()).toMatch(/caseStudy\.decisions/);
  });

  it("requires at least one decision", () => {
    expect(check({ "projects/hub.yaml": project({ caseStudy: caseStudy({ decisions: [] }) }) }).errors.join()).toMatch(
      /caseStudy\.decisions/
    );
  });

  it("rejects a decision without alternatives", () => {
    const result = check({ "projects/hub.yaml": project({ caseStudy: caseStudy({ decisions: [decision({ alternatives: {} })] }) }) });
    expect(result.errors.join()).toContain("at least one alternative");
  });

  it("rejects an ADR link that is not a web URL", () => {
    const result = check({ "projects/hub.yaml": project({ caseStudy: caseStudy({ decisions: [decision({ adr: "docs/0001.md" })] }) }) });
    expect(result.errors.join()).toMatch(/adr/);
  });
});

describe("relations", () => {
  it("rejects duplicate ids across entity types", () => {
    const result = check({ "projects/typescript.yaml": project({ id: "typescript" }) });
    expect(result.errors.join()).toContain('duplicate id "typescript"');
  });

  it("rejects references to missing entities", () => {
    const result = check({ "experiences/acme-dev.yaml": experience({ technologies: ["rust"] }) });
    expect(result.errors.join()).toContain('technologies → "rust": no technology with this id');
  });

  it("rejects references to an entity of the wrong type", () => {
    const result = check({ "experiences/acme-dev.yaml": experience({ organization: "typescript" }) });
    expect(result.errors.join()).toContain("expected a organization, found a technology");
  });

  it("rejects a public entity pointing at a private one", () => {
    const result = check({ "experiences/acme-dev.yaml": experience({ organization: "secret-corp" }) });
    expect(result.errors.join()).toContain("public content cannot reference private content");
  });

  it("only warns when the target is still in review", () => {
    const result = check({
      "experiences/acme-dev.yaml": experience({ projects: ["hub"] }),
      "projects/hub.yaml": project({ status: "review" }),
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings.join()).toContain("not published yet");
  });
});

describe("profile trajectory", () => {
  it("rejects steps pointing at missing entities", () => {
    const profile = {
      id: "me",
      name: "N",
      handle: "h",
      headline: { "en-us": "H" },
      summary: { "en-us": "S" },
      trajectory: [{ label: { "en-us": "Step" }, ref: "nope" }],
    };
    expect(check({ "profile/profile.yaml": profile }).errors.join()).toContain('trajectory → "nope"');
  });
});

describe("profile stack", () => {
  it("rejects chips pointing at unknown technologies", () => {
    const profile = {
      id: "me",
      name: "N",
      handle: "h",
      headline: { "en-us": "H" },
      summary: { "en-us": "S" },
      stack: [{ label: "Nope/Stack", technologies: ["nope"] }],
    };
    expect(check({ "profile/profile.yaml": profile }).errors.join()).toContain('stack "Nope/Stack" → "nope"');
  });
});

describe("dates", () => {
  it("rejects an end before the start", () => {
    const result = check({
      "experiences/acme-dev.yaml": experience({ positions: [{ title: { "en-us": "Dev" }, start: "2024-05", end: "2023" }] }),
    });
    expect(result.errors.join()).toContain("end 2023 is before start 2024-05");
  });

  it("accepts partial dates that overlap in the same period", () => {
    const result = check({
      "experiences/acme-dev.yaml": experience({ positions: [{ title: { "en-us": "Dev" }, start: "2024-05-10", end: "2024" }] }),
    });
    expect(result.errors).toEqual([]);
  });

  it("requires start dates on published experiences only", () => {
    const positions = [{ title: { "en-us": "Dev" } }];
    expect(check({ "experiences/acme-dev.yaml": experience({ positions }) }).errors.join()).toContain("needs a start date");
    expect(check({ "experiences/acme-dev.yaml": experience({ positions, status: "review" }) }).errors).toEqual([]);
  });

  it("requires publishedAt on published posts", () => {
    const result = check({
      "weblog/2026/10/hello/en-us.mdx": post({ title: "Hi", summary: "S", status: "published", category: "journal" }),
    });
    expect(result.errors.join()).toContain("a published post needs publishedAt");
  });
});

describe("dated weblog folders", () => {
  const published = (publishedAt: string) => post({ title: "Hi", summary: "S", status: "published", publishedAt, category: "journal" });

  it("accepts a post in the folder of its publication month", () => {
    expect(check({ "weblog/2026/10/hello/en-us.mdx": published("2026-10-09") }).errors).toEqual([]);
  });

  it("rejects a folder that disagrees with publishedAt", () => {
    const result = check({ "weblog/2026/11/hello/en-us.mdx": published("2026-10-09") });
    expect(result.errors).toEqual([
      "weblog/2026/11/hello/en-us.mdx: publishedAt 2026-10-09 disagrees with the folder 2026/11; move the post to weblog/2026/10/hello",
    ]);
  });

  it("checks only the year when publishedAt has no month", () => {
    expect(check({ "weblog/2026/03/hello/en-us.mdx": published("2026") }).errors).toEqual([]);
    expect(check({ "weblog/2025/03/hello/en-us.mdx": published("2026") }).errors.join()).toContain("disagrees with the folder 2025/03");
  });

  it("lets a draft without publishedAt sit in any month", () => {
    const draft = post({ title: "Hi", summary: "S", status: "draft", category: "journal" });
    expect(check({ "weblog/2024/02/someday/en-us.mdx": draft }).errors).toEqual([]);
  });

  it("rejects the same slug in two dated folders", () => {
    const result = check({
      "weblog/2026/10/hello/en-us.mdx": published("2026-10-09"),
      "weblog/2026/11/hello/pt-br.mdx": published("2026-11-01"),
    });
    expect(result.errors).toEqual([
      'weblog/2026/11/hello: duplicate post slug "hello" (also in weblog/2026/10/hello); a slug is a URL and must be unique',
    ]);
  });

  it("rejects the old flat layout and malformed months", () => {
    expect(check({ "weblog/hello/en-us.mdx": published("2026-10-09") }).errors.join()).toContain("expected a four-digit year");
    expect(check({ "weblog/2026/13/hello/en-us.mdx": published("2026-10-09") }).errors.join()).toContain("expected a two-digit month");
  });
});

describe("frontmatter", () => {
  it("rejects a post without a frontmatter block", () => {
    expect(check({ "weblog/2026/10/bare/en-us.mdx": "# Just a body\n" }).errors.join()).toContain("missing frontmatter");
  });

  it("accepts CRLF line endings and keeps the body intact", () => {
    const { data, content } = parseFrontmatter("---\r\ntitle: Hi\r\npublishedAt: 2026-10-01\r\n---\r\nBody --- with dashes\n");
    expect(data).toEqual({ title: "Hi", publishedAt: "2026-10-01" });
    expect(content).toBe("Body --- with dashes\n");
  });
});

describe("loadRegistry", () => {
  it("throws with every issue listed", () => {
    const root = makeContent({ "experiences/acme-dev.yaml": experience({ technologies: ["rust", "go"] }) });
    expect(() => loadRegistry(root)).toThrow(/2 issues/);
  });
});
