import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * The World of Warcraft page (ADR 0015). CI has no Battle.net keys and the
 * content has no characters yet, so this is the page's floor: both game
 * sections labelled, their empty states, the wishlist and the add-on list
 * (read from the dotfiles, or the vendored copy when GitHub does not answer).
 */

test.describe("/wow", () => {
  test("renders Forever before Retail, with their empty states", async ({ page }) => {
    const response = await page.goto("/en-us/wow");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/en-us\/wow$/);
    await expect(page.getByRole("heading", { level: 1, name: "World of Warcraft" })).toBeVisible();

    const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
    const forever = headings.indexOf("WoW Forever");
    const retail = headings.indexOf("World of Warcraft (Retail)");
    expect(forever).toBeGreaterThanOrEqual(0);
    expect(retail).toBeGreaterThan(forever);

    await expect(page.locator('section[aria-labelledby="wow-retail"]')).toContainText("Not playing right now");
    for (const id of ["wow-forever", "wow-retail"]) {
      await expect(page.locator(`section[aria-labelledby="${id}"]`).getByText("No characters mapped yet")).toBeVisible();
    }
  });

  test("lists the add-ons by group and links the Nix derivation", async ({ page }) => {
    await page.goto("/en-us/wow");
    const addons = page.locator('section[aria-labelledby="wow-addons"]');
    await expect(addons.getByRole("heading", { level: 2, name: "Add-ons" })).toBeVisible();
    await expect(addons.getByRole("link", { name: /Nix derivation/ })).toHaveAttribute(
      "href",
      /github\.com\/v1cferr\/dotfiles\/.*wow-addons/
    );
    expect(await addons.getByRole("heading", { level: 3 }).count()).toBeGreaterThanOrEqual(3);
    expect(await addons.getByRole("listitem").count()).toBeGreaterThanOrEqual(40);
    await expect(addons.getByRole("link", { name: /^Questie/ })).toHaveAttribute("href", "https://github.com/Questie/Questie");
  });

  test("links the wishlist mount on Wowhead in the reader's language, with no hotlinked image", async ({ page }) => {
    await page.goto("/pt-br/wow");
    const wishlist = page.locator('section[aria-labelledby="wow-wishlist"]');
    await expect(wishlist.getByRole("link", { name: /Rédeas de Anurelos/ })).toHaveAttribute(
      "href",
      "https://www.wowhead.com/pt/item=210061"
    );
    await expect(page.locator('img[src*="zamimg"]')).toHaveCount(0);
  });

  test("is no longer redirected, and About links to it", async ({ page }) => {
    await page.goto("/pt-br/wow");
    await expect(page).toHaveURL(/\/pt-br\/wow$/);
    await page.goto("/en-us/about");
    await expect(page.getByRole("link", { name: /World of Warcraft/ })).toHaveAttribute("href", "/en-us/wow");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us/wow");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("fits a 360px phone without horizontal scrolling", async ({ browser, isMobile }) => {
    test.skip(isMobile, "runs once, in the desktop project");
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    await page.goto("/pt-br/wow", { waitUntil: "load" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
    await context.close();
  });
});
