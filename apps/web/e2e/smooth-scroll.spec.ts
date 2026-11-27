import { expect, test } from "@playwright/test";

/*
 * In-page jumps glide unless the reader asks for less motion; Next.js is told
 * (data-scroll-behavior) to keep route changes instant.
 */
test.describe("smooth scrolling", () => {
  test("in-page jumps are smooth, and Next.js knows it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en-us/setup");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-scroll-behavior", "smooth");
    expect(await html.evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe("smooth");
  });

  test("reduced motion keeps every jump instant", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en-us/setup");
    expect(await page.locator("html").evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe("auto");
  });

  test("a route change still starts at the top", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en-us/setup");
    // The footer is the same on every viewport; <main> on /setup links only off-site.
    const now = page.getByRole("contentinfo").getByRole("link", { name: "Now", exact: true });
    await now.scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    const start = await page.evaluate(() => window.scrollY);
    // Every scroll position the route change passes through (a client navigation keeps window).
    await page.evaluate(() => {
      const seen: number[] = [];
      Object.assign(window, { scrollSeen: seen });
      window.addEventListener("scroll", () => seen.push(window.scrollY), { passive: true });
    });
    await now.click();
    await expect(page).toHaveURL(/\/en-us\/now$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
    // A jump, not a glide: nothing between the footer and the top.
    const seen = await page.evaluate(() => (window as unknown as { scrollSeen: number[] }).scrollSeen);
    expect(seen.filter((y) => y >= 5 && y < start - 5)).toEqual([]);
  });
});
