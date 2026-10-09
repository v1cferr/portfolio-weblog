import { describe, expect, it } from "vitest";

import { loadRegistry } from "../src";
import { experience, makeContent, post, project } from "./fixture";

const tree = () =>
  makeContent({
    "experiences/acme-dev.yaml": experience({ projects: ["hub", "wip"] }),
    "experiences/acme-old.yaml": experience({
      id: "acme-old",
      positions: [
        { title: { "en-us": "Intern" }, start: "2021-03", end: "2021-09" },
        { title: { "en-us": "Junior" }, start: "2021-09", end: "2022-12" },
      ],
    }),
    "experiences/uni-review.yaml": experience({ id: "uni-review", organization: "uni", status: "review" }),
    "projects/hub.yaml": project({ featured: true, experiences: ["acme-dev"], repository: "tester/hub" }),
    "projects/wip.yaml": project({ id: "wip", title: "WIP", status: "draft" }),
    "projects/hidden.yaml": project({ id: "hidden", title: "Hidden", visibility: "private" }),
    "projects/dated.yaml": project({ id: "dated", title: "Dated", startedAt: "2020-02" }),
    "weblog/hello/en-us.mdx": post({
      title: "Hello",
      summary: "S",
      status: "published",
      publishedAt: "2026-10-01",
      category: "journal",
      projects: ["hub", "wip"],
    }),
    "weblog/hello/pt-br.mdx": post({ title: "Olá", summary: "S", status: "published", publishedAt: "2026-10-01", category: "journal" }),
    "weblog/draft-post/en-us.mdx": post({ title: "Draft", summary: "S", status: "draft", category: "journal" }),
  });

describe("public registry", () => {
  const registry = loadRegistry(tree());

  it("never exposes drafts, entities in review or private entities", () => {
    expect(registry.getProjects().map((p) => p.id)).toEqual(["hub", "dated"]);
    expect(registry.getProject("wip")).toBeUndefined();
    expect(registry.getProject("hidden")).toBeUndefined();
    expect(registry.getExperience("uni-review")).toBeUndefined();
    expect(registry.getPostSlugs()).toEqual(["hello"]);
    expect(registry.getPost("draft-post", "en-us")).toBeUndefined();
  });

  it("prunes references to hidden entities", () => {
    expect(registry.getExperience("acme-dev")?.projects).toEqual(["hub"]);
    expect(registry.getPost("hello", "en-us")?.frontmatter.projects).toEqual(["hub"]);
  });

  it("serves a translation when it exists and flags fallbacks", () => {
    expect(registry.getPost("hello", "pt-br")).toMatchObject({ locale: "pt-br", isFallback: false });
    expect(registry.getPost("hello", "zh-cn")).toMatchObject({ locale: "en-us", isFallback: true });
    expect(registry.getPost("hello", "en-us")?.availableLocales.sort()).toEqual(["en-us", "pt-br"]);
  });

  it("indexes relations in both directions", () => {
    const related = registry.getRelatedContent("hub");
    expect(related).toContainEqual({ type: "experience", id: "acme-dev", field: "experiences", direction: "outgoing" });
    expect(related).toContainEqual({ type: "experience", id: "acme-dev", field: "projects", direction: "incoming" });
    expect(related).toContainEqual({ type: "post", id: "hello", field: "projects", direction: "incoming" });
    expect(registry.getRelatedContent("wip")).toEqual([]);
  });

  it("orders experiences by their latest position", () => {
    expect(registry.getExperiences().map((e) => e.id)).toEqual(["acme-dev", "acme-old"]);
  });
});

describe("timelines", () => {
  const registry = loadRegistry(tree());

  it("derives one career event per position, newest first", () => {
    expect(registry.getCareerTimeline().map((e) => `${e.entity.id}@${e.date}`)).toEqual([
      "acme-dev@2023-01",
      "acme-old@2021-09",
      "acme-old@2021-03",
    ]);
  });

  it("labels repository creation dates instead of passing them off as start dates", () => {
    const events = registry.getUnifiedTimeline({
      repositoryCreatedAt: (repo) => (repo === "tester/hub" ? "2024-06-30T12:00:00Z" : undefined),
    });
    expect(events.find((e) => e.entity.id === "hub")).toMatchObject({ date: "2024-06-30", dateSource: "repository-created" });
    expect(events.find((e) => e.entity.id === "dated")).toMatchObject({ date: "2020-02", dateSource: "content" });
    expect(events[0]).toMatchObject({ kind: "post", entity: { id: "hello" } });
  });

  it("leaves out projects with no known start", () => {
    expect(registry.getUnifiedTimeline().some((e) => e.entity.id === "hub")).toBe(false);
  });

  it("never includes hidden entities", () => {
    const ids = registry.getUnifiedTimeline().map((e) => e.entity.id);
    expect(ids).not.toContain("uni-review");
    expect(ids).not.toContain("draft-post");
  });
});

describe("tooling registry", () => {
  it("includes unpublished content only when asked", () => {
    const registry = loadRegistry(tree(), { includeUnpublished: true });
    expect(registry.getProject("wip")).toBeDefined();
    expect(registry.getExperience("uni-review")).toBeDefined();
  });
});
