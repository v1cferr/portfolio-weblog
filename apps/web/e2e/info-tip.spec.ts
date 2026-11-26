import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Helper text lives behind an "i" (InfoTip, a toggletip on shadcn's Popover):
 * hidden at rest, opened by hover on a mouse, by tap or click, and by the
 * keyboard; Esc closes it. Errors and status stay visible elsewhere.
 */

const NOTE = "Status is an editorial call, not a guess from commit activity.";

test.describe("info tips", () => {
  test("helper text is hidden until the i is opened", async ({ page }) => {
    await page.goto("/en-us/projects");
    await expect(page.getByText(NOTE)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1 }).locator("..").getByText("Personal, professional and study projects.")
    ).toBeVisible();
  });

  test("a click or tap opens it and Esc closes it", async ({ page }) => {
    await page.goto("/en-us/projects");
    const tip = page.locator("header").getByRole("button", { name: "More information" });
    await tip.click();
    await expect(page.getByText(NOTE)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText(NOTE)).toHaveCount(0);
    await expect(tip).toBeFocused();
  });

  test("the keyboard opens it", async ({ page }) => {
    await page.goto("/en-us/projects");
    const tip = page.locator("header").getByRole("button", { name: "More information" });
    await tip.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(NOTE)).toBeVisible();
  });

  test("hovering opens it, and the card stays while the pointer is on it", async ({ page, isMobile }) => {
    test.skip(isMobile, "hover needs a mouse");
    await page.goto("/en-us/projects");
    const tip = page.locator("header").getByRole("button", { name: "More information" });
    await tip.hover();
    const card = page.locator("[data-info-tip-content]");
    await expect(card).toContainText(NOTE);
    await card.hover();
    await page.waitForTimeout(300);
    await expect(card).toBeVisible();
    await page.mouse.move(5, 5);
    await expect(card).toHaveCount(0);
  });

  test("the sections that had notes carry an i instead", async ({ page }) => {
    await page.goto("/en-us/about");
    await expect(page.locator("section[aria-labelledby=stack]").getByRole("button", { name: "More information" })).toBeVisible();
    await page.goto("/en-us/decisions");
    await expect(page.locator("header").getByRole("button", { name: "More information" })).toBeVisible();
    await page.goto("/en-us/timeline");
    await expect(page.locator("header").getByRole("button", { name: "More information" })).toBeVisible();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`an open tip has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/en-us/projects");
      await page.locator("header").getByRole("button", { name: "More information" }).click();
      await expect(page.getByText(NOTE)).toBeVisible();
      const results = await new AxeBuilder({ page }).include("[data-info-tip-content]").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => v.id)).toEqual([]);
    });
  }
});
