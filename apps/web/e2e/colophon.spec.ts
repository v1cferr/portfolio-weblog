import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * The colophon (content/pages/colophon): both locales, the English fallback
 * for zh-cn, the links that lead to it, accessibility in both themes and the
 * smallest phone width.
 */

test.describe("colophon", () => {
  test("renders in English with its last-updated date", async ({ page }) => {
    await page.goto("/en-us/colophon");
    await expect(page).toHaveTitle(/How this site is built/);
    await expect(page.getByRole("heading", { level: 1, name: "How this site is built" })).toBeVisible();
    for (const name of ["Why this site exists", "Stack", "How the content works", "Key decisions", "AI", "Quality", "Timeline"]) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
    await expect(page.getByText("Last updated")).toBeVisible();
    await expect(page.locator("header time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByRole("link", { name: "content/pages/colophon/en-us.mdx" })).toBeVisible();
    // Internal links keep the reader's locale.
    await expect(page.getByRole("link", { name: "the next page" })).toHaveAttribute("href", "/en-us/next");
  });

  test("renders in Portuguese", async ({ page }) => {
    await page.goto("/pt-br/colophon");
    await expect(page.getByRole("heading", { level: 1, name: "Como este site foi feito" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Por que este site existe" })).toBeVisible();
    await expect(page.getByText("Última atualização:")).toBeVisible();
    await expect(page.locator(".prose-hub")).toHaveAttribute("lang", "pt-br");
  });

  test("falls back to the English text in Chinese", async ({ page }) => {
    await page.goto("/zh-cn/colophon");
    await expect(page.getByRole("heading", { level: 1, name: "How this site is built" })).toBeVisible();
    await expect(page.locator(".prose-hub")).toHaveAttribute("lang", "en-us");
  });

  test("the footer links to it", async ({ page }) => {
    await page.goto("/pt-br");
    await page.getByRole("contentinfo").getByRole("link", { name: "Como este site foi feito" }).click();
    await expect(page).toHaveURL(/\/pt-br\/colophon$/);
    await expect(page.getByRole("heading", { level: 1, name: "Como este site foi feito" })).toBeVisible();
  });

  test("the About page and this site's case study link to it", async ({ page }) => {
    await page.goto("/en-us/about");
    await expect(page.getByRole("main").getByRole("link", { name: "How this site is built" })).toHaveAttribute("href", "/en-us/colophon");
    await page.goto("/en-us/projects/portfolio-weblog");
    await expect(page.getByRole("link", { name: "The whole story of how this site is built" })).toHaveAttribute("href", "/en-us/colophon");
  });

  test("is listed in the sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/en-us/colophon</loc>");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/en-us/colophon");
      // Entrances fade in; audit the settled page, not a frame mid-fade.
      await page.waitForFunction(() =>
        [...document.querySelectorAll("[data-reveal]")].every((el) => {
          const opacity = getComputedStyle(el).opacity;
          return el.getBoundingClientRect().top < window.innerHeight * 0.85 ? opacity === "1" : ["0", "1"].includes(opacity);
        })
      );
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("has no horizontal scrolling at 360px", async ({ browser, isMobile }) => {
    test.skip(isMobile, "runs once, in the desktop project");
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    for (const path of ["/en-us/colophon", "/pt-br/colophon"]) {
      await page.goto(path, { waitUntil: "load" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path}: no horizontal scrolling`).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
});
