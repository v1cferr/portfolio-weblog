import { describe, expect, it } from "vitest";

import { onSiteDecisionPath, resolveDecisionLink, rewriteDecisionLinks } from "../src/lib/decision-links";

const REPO = "https://github.com/v1cferr/portfolio-weblog";

describe("resolveDecisionLink", () => {
  it("sends another record to its page on the site", () => {
    expect(resolveDecisionLink("0006-local-search-before-ai.md")).toBe("/decisions/0006");
    expect(resolveDecisionLink("0006-local-search-before-ai.md#decision")).toBe("/decisions/0006#decision");
  });

  it("sends any other repository file to GitHub", () => {
    expect(resolveDecisionLink("../architecture/ai-roadmap.md")).toBe(`${REPO}/blob/main/docs/architecture/ai-roadmap.md`);
    expect(resolveDecisionLink("./README.md")).toBe(`${REPO}/blob/main/docs/decisions/README.md`);
    expect(resolveDecisionLink("../../apps/web/next.config.ts")).toBe(`${REPO}/blob/main/apps/web/next.config.ts`);
  });

  it("leaves absolute URLs, anchors and site paths alone", () => {
    for (const href of ["https://nixos.org/branding", "mailto:a@b.c", "#context", "/en-us/about"]) {
      expect(resolveDecisionLink(href)).toBe(href);
    }
  });

  it("rewrites every link of a body", () => {
    const body =
      "partly superseded by\n  [0008](0008-spotify-now-playing.md) and [roadmap](../architecture/ai-roadmap.md), [web](https://x.dev)";
    expect(rewriteDecisionLinks(body)).toBe(
      `partly superseded by\n  [0008](/decisions/0008) and [roadmap](${REPO}/blob/main/docs/architecture/ai-roadmap.md), [web](https://x.dev)`
    );
  });
});

describe("onSiteDecisionPath", () => {
  it("maps this repository's records and their folder to the site", () => {
    expect(onSiteDecisionPath(`${REPO}/blob/main/docs/decisions/0001-content-first.md`)).toBe("/decisions/0001");
    expect(onSiteDecisionPath(`${REPO}/tree/main/docs/decisions`)).toBe("/decisions");
    expect(onSiteDecisionPath(`${REPO}/tree/main/docs/decisions/`)).toBe("/decisions");
  });

  it("leaves other repositories and other files alone", () => {
    expect(onSiteDecisionPath("https://github.com/v1cferr/dotfiles/blob/main/docs/decisions/0015-limine-over-grub.md")).toBeUndefined();
    expect(onSiteDecisionPath("https://github.com/v1cferr/imobos/blob/main/docs/adr/0007-sign-up.md")).toBeUndefined();
    expect(onSiteDecisionPath(`${REPO}/blob/main/docs/architecture/ai-roadmap.md`)).toBeUndefined();
    expect(onSiteDecisionPath(`${REPO}-fork/tree/main/docs/decisions`)).toBeUndefined();
  });
});
