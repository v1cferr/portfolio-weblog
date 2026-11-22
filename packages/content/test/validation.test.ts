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
    const result = check({ "weblog/hello/en-us.mdx": post({ title: "Hi", summary: "S", status: "published", category: "journal" }) });
    expect(result.errors.join()).toContain("a published post needs publishedAt");
  });
});

describe("frontmatter", () => {
  it("rejects a post without a frontmatter block", () => {
    expect(check({ "weblog/bare/en-us.mdx": "# Just a body\n" }).errors.join()).toContain("missing frontmatter");
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
