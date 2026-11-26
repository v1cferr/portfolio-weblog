import { expect, type Page, test } from "@playwright/test";

/*
 * Loading indicators appear only when there is a wait, and only after 300 ms,
 * so a fast load never flashes one (hooks/use-delayed.ts).
 */

async function openSearch(page: Page) {
  await page.goto("/en-us/projects");
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.keyboard.press("/");
  await expect(page.getByPlaceholder(/Search experiences/)).toBeFocused();
}

test.describe("loading states", () => {
  test("a slow search index shows the spinner, then the results", async ({ page }) => {
    await page.route("**/api/search/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await openSearch(page);
    const loading = page.getByRole("status").filter({ hasText: "Loading the search index…" });
    await expect(loading).toBeVisible();
    await expect(loading.locator("[data-slot=spinner]")).toBeVisible();
    await page.keyboard.type("nixos");
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 10_000 });
    await expect(loading).toHaveCount(0);
  });

  test("the spinner never shows before 300 ms of waiting", async ({ page }) => {
    // The invariant, independent of how fast the machine running the test is:
    // whenever the loading line appears, the index had been loading for 300 ms.
    await page.addInitScript(() => {
      const w = window as unknown as { __loadStart?: number; __shownAt?: number };
      new MutationObserver(() => {
        if (w.__loadStart === undefined && document.querySelector("[data-slot=command-input]")) w.__loadStart = performance.now();
        if (w.__shownAt === undefined && document.body.innerText.includes("Loading the search index")) w.__shownAt = performance.now();
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await openSearch(page);
    await page.keyboard.type("nixos");
    await expect(page.getByRole("option").first()).toBeVisible();
    const { start, shown } = await page.evaluate(() => {
      const w = window as unknown as { __loadStart?: number; __shownAt?: number };
      return { start: w.__loadStart ?? 0, shown: w.__shownAt };
    });
    if (shown !== undefined) expect(shown - start).toBeGreaterThanOrEqual(290);
  });
});
