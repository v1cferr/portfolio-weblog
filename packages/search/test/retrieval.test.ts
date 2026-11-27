import { loadRegistry } from "@workspace/content";
import { describe, expect, it } from "vitest";

import { experience, makeContent, post, project } from "../../content/test/fixture";
import {
  buildRetrievalPassages,
  createRetriever,
  dateInWords,
  MAX_PASSAGES,
  profileIntro,
  roleSentence,
  splitByHeading,
  splitParagraphs,
} from "../src";

const registry = loadRegistry(
  makeContent({
    "experiences/acme-dev.yaml": experience({
      learnings: { "en-us": ["Kubernetes operations"] },
      positions: [{ title: { "en-us": "Developer" }, start: "2023-01", responsibilities: { "en-us": ["Owned the observability stack"] } }],
    }),
    "projects/hub.yaml": project({ technologies: ["python"] }),
    "projects/secret.yaml": project({ id: "secret", title: "Secret plans", visibility: "private" }),
    "weblog/2026/10/hello/en-us.mdx": post(
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

  it("dates experiences in words, so 'when' questions can be answered", () => {
    expect(passages.find((passage) => passage.entityId === "acme-dev")?.text).toContain("since January 2023");
  });

  it("writes the About passage as sentences, not field lines", () => {
    const about = passages.find((passage) => passage.type === "profile")?.text ?? "";
    expect(about).not.toMatch(/Current role:|Location:|\d{4}-\d{2} –/);
  });
});

describe("dateInWords", () => {
  it("spells partial dates out in each language", () => {
    expect(dateInWords("2026-08", "pt-br")).toBe("agosto de 2026");
    expect(dateInWords("2026-08", "en-us")).toBe("August 2026");
    expect(dateInWords("2026-03-05", "pt-br")).toBe("5 de março de 2026");
    expect(dateInWords("2026-03-05", "en-us")).toBe("March 5, 2026");
    expect(dateInWords("2024", "en-us")).toBe("2024");
  });
});

describe("roleSentence", () => {
  const fai = { title: "Analista de Sistemas de IA", org: "FAI·UFSCar", article: "a" as const, selfEmployed: false };

  it("puts a current role in the present and a past one in the past", () => {
    expect(roleSentence({ ...fai, start: "2026-08", end: undefined }, "pt-br")).toBe(
      "Trabalho como Analista de Sistemas de IA na FAI·UFSCar desde agosto de 2026."
    );
    expect(roleSentence({ ...fai, title: "Estagiário", start: "2026-03", end: "2026-07" }, "pt-br")).toBe(
      "Fui Estagiário na FAI·UFSCar de março de 2026 a julho de 2026."
    );
    expect(roleSentence({ ...fai, title: "Intern", start: "2026-03", end: "2026-07" }, "en-us")).toBe(
      "I was Intern at FAI·UFSCar from March 2026 to July 2026."
    );
    expect(roleSentence({ ...fai, title: "AI Systems Analyst", start: "2026-08", end: undefined }, "en-us")).toBe(
      "I have worked as AI Systems Analyst at FAI·UFSCar since August 2026."
    );
  });

  it("uses the organization's article in Portuguese, and says self-employed roles plainly", () => {
    expect(roleSentence({ ...fai, org: "Senac São Paulo", article: "o", start: "2025-01", end: "2025-06" }, "pt-br")).toBe(
      "Fui Analista de Sistemas de IA no Senac São Paulo de janeiro de 2025 a junho de 2025."
    );
    expect(roleSentence({ ...fai, title: "Dev", org: "Freelance", selfEmployed: true, start: "2024-04", end: undefined }, "pt-br")).toBe(
      "Trabalho como Dev por conta própria (Freelance) desde abril de 2024."
    );
  });
});

describe("profileIntro", () => {
  const fai = {
    title: "Analista de Sistemas de IA",
    org: "FAI·UFSCar",
    article: "a" as const,
    selfEmployed: false,
    start: "2026-08",
    end: undefined,
  };
  const freelance = { title: "Dev", org: "Freelance", article: "a" as const, selfEmployed: true, start: "2024-04", end: undefined };

  it("says the headline role once, joined to where and since when", () => {
    const intro = profileIntro("Victor Ferreira", "v1cferr", "Analista de Sistemas de IA", [fai, freelance], "pt-br");
    expect(intro).toEqual([
      "Sou Victor Ferreira (v1cferr), Analista de Sistemas de IA na FAI·UFSCar desde agosto de 2026.",
      "Também trabalho como Dev por conta própria (Freelance) desde abril de 2024.",
    ]);
    expect(intro.join(" ").match(/Analista de Sistemas de IA/g)).toHaveLength(1);
  });

  it("recognizes a headline left in another language and says the role in the page's", () => {
    const role = { ...fai, titles: ["AI Systems Analyst", "Analista de Sistemas de IA"] };
    expect(profileIntro("Victor", "v1cferr", "AI Systems Analyst", [role], "pt-br")).toEqual([
      "Sou Victor (v1cferr), Analista de Sistemas de IA na FAI·UFSCar desde agosto de 2026.",
    ]);
  });

  it("keeps the headline apart when it names no current role", () => {
    expect(profileIntro("Victor", "v1cferr", "Developer", [{ ...fai, title: "AI Systems Analyst" }], "en-us")).toEqual([
      "I'm Victor (v1cferr): Developer.",
      "I have worked as AI Systems Analyst at FAI·UFSCar since August 2026.",
    ]);
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
