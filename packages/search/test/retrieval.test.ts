import { loadRegistry } from "@workspace/content";
import { describe, expect, it } from "vitest";

import { experience, makeContent, post, project } from "../../content/test/fixture";
import { buildRetrievalPassages, createRetriever, MAX_PASSAGES, splitByHeading, splitParagraphs } from "../src";

const registry = loadRegistry(
  makeContent({
    "experiences/acme-dev.yaml": experience({
      learnings: { "en-us": ["Kubernetes operations"] },
      positions: [{ title: { "en-us": "Developer" }, start: "2023-01", responsibilities: { "en-us": ["Owned the observability stack"] } }],
    }),
    "projects/hub.yaml": project({ technologies: ["python"] }),
    "projects/secret.yaml": project({ id: "secret", title: "Secret plans", visibility: "private" }),
    "weblog/hello/en-us.mdx": post(
      { title: "Hello", summary: "First post", status: "published", publishedAt: "2026-10-01", category: "journal", tags: ["intro"] },
      "Intro paragraph.\n\n## Declarative machines\n\nEvery host is described in a flake.\n\n```nix\n# not a heading\n```\n\n## Gardening\n\nTomatoes need sun."
    ),
  })
);

describe("buildRetrievalPassages", () => {
  const passages = buildRetrievalPassages(registry, "en-us");

  it("adds the About page and leaves out private content and technologies", () => {
    expect(passages.some((passage) => passage.type === "profile" && passage.url === "/en-us/about")).toBe(true);
    expect(passages.some((passage) => passage.type === "technology")).toBe(false);
    expect(JSON.stringify(passages)).not.toContain("Secret plans");
  });

  it("splits posts by heading and keeps the document id and URL on every chunk", () => {
    const chunks = passages.filter((passage) => passage.entityId === "hello");
    expect(chunks.map((chunk) => chunk.title)).toEqual(["Hello", "Hello", "Hello › Declarative machines", "Hello › Gardening"]);
    for (const chunk of chunks) expect(chunk).toMatchObject({ docId: "post:hello:en-us", url: "/en-us/weblog/hello" });
    expect(new Set(passages.map((passage) => passage.id)).size).toBe(passages.length);
  });

  it("dates experiences, so 'when' questions can be answered", () => {
    expect(passages.find((passage) => passage.entityId === "acme-dev")?.text).toContain("2023-01 – present");
  });
});

describe("createRetriever", () => {
  // Scores grow with the corpus (BM25's IDF) and this fixture is tiny, so the
  // ranking is tested without the threshold; apps/web/test/profile-chat.test.ts
  // checks the default threshold against the real content.
  const retriever = createRetriever(buildRetrievalPassages(registry, "en-us"));
  const anyScore = { minScore: 0 };

  it("returns sources with their URLs for a question the site answers", () => {
    const hits = retriever.retrieve("Has he worked with Kubernetes?", anyScore);
    expect(hits[0]).toMatchObject({ entityId: "acme-dev", url: "/en-us/career/acme-dev" });
    expect(hits.length).toBeLessThanOrEqual(MAX_PASSAGES);
  });

  it("finds the right section of a post", () => {
    expect(retriever.retrieve("How are his machines declared in a flake?", anyScore)[0]?.title).toBe("Hello › Declarative machines");
  });

  it("ignores accents and case", () => {
    expect(retriever.retrieve("KUBERNÉTES", anyScore)[0]?.entityId).toBe("acme-dev");
  });

  it("returns nothing for nonsense or questions made only of stop words", () => {
    expect(retriever.retrieve("asdf qwerty zxcv", anyScore)).toEqual([]);
    expect(retriever.retrieve("what is the", anyScore)).toEqual([]);
    expect(retriever.retrieve("o que é isso?", anyScore)).toEqual([]);
  });

  it("returns nothing when the best passage scores below the threshold", () => {
    expect(retriever.retrieve("Kubernetes", { minScore: 1000 })).toEqual([]);
  });
});

describe("splitting helpers", () => {
  it("ignores # lines inside code fences", () => {
    expect(splitByHeading("## A\n\ntext\n\n```sh\n# comment\n```").map((section) => section.heading)).toEqual(["A"]);
  });

  it("groups paragraphs up to the size limit", () => {
    expect(splitParagraphs("aaaa\nbbbb\ncccc", 9)).toEqual(["aaaa\nbbbb", "cccc"]);
  });
});
