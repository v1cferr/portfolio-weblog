import { describe, expect, it } from "vitest";

import { ContentValidationError, findPage, loadPages, loadPagesContent } from "../src";
import { makeContent } from "./fixture";

const page = (title: string, extra = "") =>
  `---\ntitle: ${title}\nsummary: About ${title}\nupdatedAt: 2026-11-25\n${extra}---\n\nBody of ${title}.\n`;

describe("standalone pages", () => {
  it("loads each translation with its body", () => {
    const root = makeContent({
      "pages/colophon/en-us.mdx": page("Colophon"),
      "pages/colophon/pt-br.mdx": page("Colofão"),
    });
    const pages = loadPages(root);
    expect(pages.map((p) => `${p.slug}/${p.locale}`)).toEqual(["colophon/en-us", "colophon/pt-br"]);
    expect(pages[0]).toMatchObject({ file: "pages/colophon/en-us.mdx", frontmatter: { updatedAt: "2026-11-25", status: "published" } });
    expect(pages[0]?.body.trim()).toBe("Body of Colophon.");
  });

  it("is empty without a pages/ folder", () => {
    expect(loadPages(makeContent({}))).toEqual([]);
  });

  it("hides drafts and private translations", () => {
    const root = makeContent({
      "pages/colophon/en-us.mdx": page("Colophon", "status: draft\n"),
      "pages/colophon/pt-br.mdx": page("Colofão", "visibility: private\n"),
    });
    expect(loadPages(root)).toEqual([]);
  });

  it("falls back to English and says so", () => {
    const pages = loadPages(makeContent({ "pages/colophon/en-us.mdx": page("Colophon") }));
    expect(findPage(pages, "colophon", "zh-cn")).toMatchObject({ locale: "en-us", isFallback: true, availableLocales: ["en-us"] });
    expect(findPage(pages, "colophon", "en-us")?.isFallback).toBe(false);
    expect(findPage(pages, "missing", "en-us")).toBeUndefined();
  });

  it("rejects bad slugs, bad locales, missing dates and unknown fields", () => {
    const root = makeContent({
      "pages/Colophon/en-us.mdx": page("Colophon"),
      "pages/colophon/fr.mdx": page("Colophon"),
      "pages/colophon/en-us.mdx": "---\ntitle: Colophon\nsummary: S\n---\nBody\n",
      "pages/colophon/pt-br.mdx": page("Colofão", "author: me\n"),
    });
    const messages = loadPagesContent(root).issues.map((issue) => issue.file);
    expect(messages).toEqual(["pages/Colophon", "pages/colophon/en-us.mdx", "pages/colophon/fr.mdx", "pages/colophon/pt-br.mdx"]);
    expect(() => loadPages(root)).toThrow(ContentValidationError);
  });
});
