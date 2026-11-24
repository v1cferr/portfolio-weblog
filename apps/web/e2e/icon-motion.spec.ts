import { expect, type Page, test } from "@playwright/test";

/*
 * The motion language for icons (ADR 0007): CSS micro-interactions driven by
 * the parent link, and Motion state icons on the stateful controls.
 */

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

/** The computed `translate` of the first "See all" arrow on the home page. */
function seeAllArrow(page: Page) {
  const link = page.getByRole("link", { name: "See all" }).first();
  const arrow = link.locator("svg.icon-fwd");
  const translate = () => arrow.evaluate((element) => getComputedStyle(element).translate);
  return { link, translate };
}

test.describe("link icons", () => {
  test("an arrow nudges forward while its link is hovered", async ({ page }) => {
    test.skip(isMobile(page), "hover effects are for pointer devices");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en-us");
    const { link, translate } = seeAllArrow(page);
    expect(await translate()).toBe("none");
    await link.hover();
    await expect.poll(translate).toBe("3px");
  });

  test("the arrow stays still with reduced motion", async ({ page }) => {
    test.skip(isMobile(page), "hover effects are for pointer devices");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en-us");
    const { link, translate } = seeAllArrow(page);
    await link.hover();
    // Longer than the 170ms transition, so a nudge would have landed.
    await page.waitForTimeout(400);
    expect(await translate()).toBe("none");
  });

  test("the arrow also moves on keyboard focus", async ({ page }) => {
    test.skip(isMobile(page), "keyboard focus is checked on desktop");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en-us");
    const { link, translate } = seeAllArrow(page);
    // After a key press, focus counts as keyboard focus, so :focus-visible matches.
    await page.keyboard.press("Shift");
    await link.focus();
    await expect(link).toBeFocused();
    await expect.poll(translate).toBe("3px");
  });
});

test.describe("state icons", () => {
  test("the copy button shows a check after copying, then offers to copy again", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "clipboard permissions are Chromium's");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en-us/setup");
    const button = page.getByRole("button", { name: "Copy as Markdown" });
    await button.click();
    const copied = page.locator('button[data-state="copied"]');
    await expect(copied).toBeVisible();
    await expect(copied.locator('svg[data-state="copied"]')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("#");
    // Back to the copy icon after about 1.5s.
    await expect(page.locator('button[data-state="idle"]').getByText("Copy as Markdown")).toBeVisible({ timeout: 4000 });
  });

  test("the theme toggle switches the theme and its icon", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "light" });
    await page.goto("/en-us");
    const toggle = page.getByRole("banner").getByRole("button", { name: "Change theme" });
    const icon = toggle.locator("[data-theme-icon]");
    await expect(icon).toHaveAttribute("data-theme-icon", "system");

    await toggle.click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(icon).toHaveAttribute("data-theme-icon", "dark");

    await toggle.click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await expect(icon).toHaveAttribute("data-theme-icon", "light");
  });

  test("the menu icon turns into a cross while the menu is open", async ({ page }) => {
    test.skip(!isMobile(page), "the menu button is for phones and tablets");
    await page.goto("/en-us");
    const button = page.getByRole("banner").getByRole("button", { name: "Open menu" });
    await expect(button.locator('svg[data-state="closed"]')).toHaveCount(1);
    await button.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // The open sheet hides the header from the accessibility tree, so find the icon by CSS.
    await expect(page.locator('header button[aria-label="Open menu"] svg[data-state="open"]')).toHaveCount(1);
  });
});
