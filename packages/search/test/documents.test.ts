import { loadRegistry } from "@workspace/content";
import MiniSearch from "minisearch";
import { describe, expect, it } from "vitest";

// The content package's fixture builder writes throwaway content trees.
import { experience, makeContent, post, project } from "../../content/test/fixture";
import { buildSearchDocuments, mdxToText, type SearchDocument, searchOptions } from "../src";

const registry = loadRegistry(
  makeContent({
    "experiences/acme-dev.yaml": experience({
      learnings: { "en-us": ["Kubernetes operations"] },
      positions: [{ title: { "en-us": "Developer" }, start: "2023-01", responsibilities: { "en-us": ["Owned the observability stack"] } }],
    }),
    "projects/hub.yaml": project({ technologies: ["python"] }),
    "projects/secret.yaml": project({ id: "secret", title: "Secret plans", visibility: "private" }),
    "projects/wip.yaml": project({ id: "wip", title: "Unfinished", status: "draft" }),
    "weblog/hello/en-us.mdx": post(
      { title: "Hello", summary: "First post", status: "published", publishedAt: "2026-10-01", category: "journal", tags: ["intro"] },
      "# Heading\n\n```ts\nconst hidden = 1;\n```\n\nVisible prose."
    ),
    "weblog/draft/en-us.mdx": post({ title: "Draft thoughts", summary: "S", status: "draft", category: "journal" }),
  })
);

describe("buildSearchDocuments", () => {
  const docs = buildSearchDocuments(registry, "pt-br");
  const ids = docs.map((doc) => doc.entityId);

  it("indexes every public entity type", () => {
    expect(new Set(docs.map((doc) => doc.type))).toEqual(new Set(["experience", "project", "post", "technology"]));
  });

  it("never indexes drafts or private content", () => {
    expect(ids).not.toContain("secret");
    expect(ids).not.toContain("wip");
    expect(ids).not.toContain("draft");
    expect(JSON.stringify(docs)).not.toContain("Secret plans");
  });

  it("prefixes URLs with the index locale and records the text's real locale", () => {
    const hub = docs.find((doc) => doc.entityId === "hub");
    expect(hub).toMatchObject({ url: "/pt-br/projects/hub", locale: "en-us", section: "projects" });
  });

  it("gives every document a unique id", () => {
    expect(new Set(docs.map((doc) => doc.id)).size).toBe(docs.length);
  });

  it("is searchable with the shared index options", () => {
    const index = new MiniSearch<SearchDocument>(searchOptions);
    index.addAll(docs);
    expect(index.search("kubernet")[0]?.entityId).toBe("acme-dev");
    expect(index.search("observability")[0]?.entityId).toBe("acme-dev");
    expect(index.search("python").map((hit) => hit.id as string)).toContain("project:hub:pt-br");
  });
});

describe("mdxToText", () => {
  it("keeps prose and drops code, tags and markup", () => {
    expect(mdxToText("import X from 'y'\n# Title\n<Callout>Note</Callout>\n```js\nsecret()\n```\n[link](http://x)")).toBe(
      "Title Note link"
    );
  });
});
