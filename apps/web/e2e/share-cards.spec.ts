import { expect, test } from "@playwright/test";

/*
 * Link previews: the pages point og:image and twitter:image at their own
 * generated card, and the card route answers with a PNG. The meta tags carry
 * the production origin (metadataBase), so the image is fetched by path from
 * the server under test.
 */
const CASES = [
  { path: "/en-us/weblog/rebuilding-the-hub-content-first", title: "Rebuilding this hub around content, not components" },
  { path: "/pt-br/projects/obsidian-rag", title: "obsidian-rag" },
  { path: "/en-us/career/fai-ufscar-2026", title: "AI systems analyst" },
  { path: "/en-us", title: "Victor Ferreira" },
];

test.describe("share cards", () => {
  // The cards and tags do not depend on the viewport.
  test.skip(({ isMobile }) => isMobile, "desktop only");

  for (const { path, title } of CASES) {
    test(`${path} links its own Open Graph image and a large X card`, async ({ page, request }) => {
      await page.goto(path);
      const meta = (selector: string) => page.locator(`head meta[${selector}]`).first().getAttribute("content");

      expect(await meta('property="og:title"')).toContain(title);
      expect(await meta('name="twitter:card"')).toBe("summary_large_image");
      expect(await meta('property="og:url"')).toMatch(new RegExp(`${path}$`));

      const image = await meta('property="og:image"');
      expect(image).not.toBeNull();
      const url = new URL(image ?? "");
      expect(url.pathname).toBe(`${path}/opengraph-image`);
      expect(await meta('name="twitter:image"')).toBe(image);

      const response = await request.get(`${url.pathname}${url.search}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("image/png");
      expect((await response.body()).byteLength).toBeGreaterThan(10_000);
    });
  }

  test("pages without a card of their own fall back to the site card", async ({ page }) => {
    await page.goto("/en-us/about");
    const image = await page.locator('head meta[property="og:image"]').first().getAttribute("content");
    expect(new URL(image ?? "").pathname).toBe("/en-us/opengraph-image");
    await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute("content", "profile");
  });
});
