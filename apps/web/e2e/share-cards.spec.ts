import { expect, test, type Page } from "@playwright/test";

/*
 * Link previews: the pages point og:image and twitter:image at their own
 * generated card, with a localized alt text, and the card route answers with a
 * PNG. The meta tags carry the production origin (metadataBase), so the image
 * is fetched by path from the server under test.
 */
const DETAIL_CASES = [
  { path: "/en-us/weblog/rebuilding-the-hub-content-first", title: "Rebuilding this hub around content, not components" },
  { path: "/pt-br/projects/obsidian-rag", title: "obsidian-rag" },
  { path: "/en-us/career/fai-ufscar-2026", title: "AI Systems Analyst" },
  { path: "/en-us", title: "Victor Ferreira" },
];

/** Section pages: each has a card of its own, titled after the section. */
const SECTION_CASES = [
  { path: "/en-us/projects", title: "Projects" },
  { path: "/pt-br/projects", title: "Projetos" },
  { path: "/en-us/career", title: "Career" },
  { path: "/pt-br/weblog", title: "Weblog" },
  { path: "/en-us/timeline", title: "Timeline" },
  { path: "/pt-br/education", title: "Estudos" },
  { path: "/en-us/about", title: "About" },
  { path: "/pt-br/setup", title: "Setup" },
  { path: "/en-us/now", title: "Now" },
  { path: "/pt-br/next", title: "Próximos passos" },
];

function metaOf(page: Page) {
  return (selector: string) => page.locator(`head meta[${selector}]`).first().getAttribute("content");
}

test.describe("share cards", () => {
  // The cards and tags do not depend on the viewport.
  test.skip(({ isMobile }) => isMobile, "desktop only");

  for (const { path, title } of [...DETAIL_CASES, ...SECTION_CASES]) {
    test(`${path} links its own Open Graph image and a large X card`, async ({ page, request }) => {
      await page.goto(path);
      const meta = metaOf(page);

      expect(await meta('property="og:title"')).toContain(title);
      expect(await meta('name="twitter:card"')).toBe("summary_large_image");
      expect(await meta('property="og:url"')).toMatch(new RegExp(`${path}$`));

      const image = await meta('property="og:image"');
      expect(image).not.toBeNull();
      const url = new URL(image ?? "");
      // Its own card, not the site card the pages used to fall back to.
      expect(url.pathname).toBe(`${path}/opengraph-image/card`);
      expect(await meta('name="twitter:image"')).toBe(image);

      // The alt text names the page, in the page's language.
      const alt = await meta('property="og:image:alt"');
      expect(alt?.trim()).toBeTruthy();
      if (path !== "/en-us") expect(alt).toContain(title);
      expect(await meta('name="twitter:image:alt"')).toBe(alt);

      const response = await request.get(`${url.pathname}${url.search}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("image/png");
      expect((await response.body()).byteLength).toBeGreaterThan(10_000);
    });
  }

  test("the about page keeps its profile type", async ({ page }) => {
    await page.goto("/en-us/about");
    await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute("content", "profile");
  });

  test("pages without a card of their own fall back to the localized site card", async ({ page }) => {
    await page.goto("/pt-br/weblog/tags/nextjs");
    const meta = metaOf(page);
    expect(new URL((await meta('property="og:image"')) ?? "").pathname).toBe("/pt-br/opengraph-image/card");
    expect(await meta('property="og:image:alt"')).toBe("Victor Ferreira (v1cferr), personal hub em v1cferr.dev");
  });

  // LinkedIn wants a description of at least 100 characters, and without a
  // declared date it takes the first <time> on the page (a 2025 recommendation
  // on the home) as the publish date.
  for (const path of ["/pt-br", "/en-us"]) {
    test(`${path} has a long enough description and declares the site's date`, async ({ page }) => {
      await page.goto(path);
      const meta = metaOf(page);
      expect((await meta('property="og:description"'))?.length).toBeGreaterThanOrEqual(100);
      const date = await meta('name="publish_date"');
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect((date ?? "") >= "2026-11-01").toBe(true);
      expect(await meta('name="og:publish_date"')).toBe(date);
    });
  }

  test("a post declares its own publish date", async ({ page }) => {
    await page.goto("/en-us/weblog/from-arch-to-nixos");
    await expect(page.locator('head meta[name="publish_date"]')).toHaveAttribute("content", "2026-11-23");
  });
});
