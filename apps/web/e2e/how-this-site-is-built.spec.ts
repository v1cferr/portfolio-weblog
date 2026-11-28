import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { auditThemeOnce } from "./axe-theme";

/*
 * "How this site is built" is a weblog post (it used to be the /colophon page):
 * both locales, the old address redirecting to it, the links that lead to it,
 * accessibility in both themes and the smallest phone width.
 */

const POST = "/weblog/how-this-site-is-built";

test.describe("how this site is built", () => {
  test("renders in English as a weblog post", async ({ page }) => {
    await page.goto(`/en-us${POST}`);
    await expect(page.getByRole("heading", { level: 1, name: "How this site is built" })).toBeVisible();
    for (const name of ["Why this site exists", "Stack", "How the content works", "Key decisions", "AI", "Quality", "Timeline"]) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
    // Internal links keep the reader's locale.
    await expect(page.getByRole("link", { name: "the next page" })).toHaveAttribute("href", "/en-us/next");
  });

  test("renders in Portuguese", async ({ page }) => {
    await page.goto(`/pt-br${POST}`);
    await expect(page.getByRole("heading", { level: 1, name: "Como este site foi feito" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Por que este site existe" })).toBeVisible();
  });

  test("is listed in the weblog", async ({ page }) => {
    await page.goto("/en-us/weblog");
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: /How this site is built/ })
        .first()
    ).toHaveAttribute("href", `/en-us${POST}`);
  });

  test("the old /colophon address redirects to the post", async ({ page, request }) => {
    const response = await request.get("/pt-br/colophon", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`/pt-br${POST}`);
    await page.goto("/en-us/colophon");
    await expect(page).toHaveURL(new RegExp(`/en-us${POST}$`));
  });

  test("the footer links to it", async ({ page }) => {
    await page.goto("/pt-br");
    await page.getByRole("contentinfo").getByRole("link", { name: "Como este site foi feito" }).click();
    await expect(page).toHaveURL(new RegExp(`/pt-br${POST}$`));
    await expect(page.getByRole("heading", { level: 1, name: "Como este site foi feito" })).toBeVisible();
  });

  test("the About page and this site's case study link to it", async ({ page }) => {
    await page.goto("/en-us/about");
    // The "more about me" list links it, and so does the latest-writing list now that it is a post.
    const links = page.getByRole("main").getByRole("link", { name: "How this site is built" });
    await expect(links.first()).toBeVisible();
    expect(new Set(await links.evaluateAll((all) => all.map((a) => a.getAttribute("href"))))).toEqual(new Set([`/en-us${POST}`]));
    await page.goto("/en-us/projects/portfolio-weblog");
    await expect(page.getByRole("link", { name: "The whole story of how this site is built" })).toHaveAttribute("href", `/en-us${POST}`);
  });

  test("the sitemap lists the post and no longer the old page", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`/en-us${POST}</loc>`);
    expect(sitemap).not.toContain("/colophon</loc>");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      auditThemeOnce(theme);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(`/en-us${POST}`);
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
    for (const path of [`/en-us${POST}`, `/pt-br${POST}`]) {
      await page.goto(path, { waitUntil: "load" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path}: no horizontal scrolling`).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
});
