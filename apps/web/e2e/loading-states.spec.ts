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

  test("a fast search index never shows it", async ({ page }) => {
    await page.addInitScript(() => {
      // Record whether the loading line ever appears.
      new MutationObserver(() => {
        if (document.body.innerText.includes("Loading the search index")) (window as unknown as { __flashed: boolean }).__flashed = true;
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await openSearch(page);
    await page.keyboard.type("nixos");
    await expect(page.getByRole("option").first()).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __flashed?: boolean }).__flashed ?? false)).toBe(false);
  });
});
