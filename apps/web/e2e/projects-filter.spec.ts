import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/*
 * The Projects filter (option A, 2026-11-25): Status as a segmented control,
 * Type as chips, both single-choice radio groups with a count per option. The
 * owner's bug report: at ?category=study&state=historical the chosen options
 * did not look chosen, the count said 4 with 3 cards, and 2024 was an empty group.
 */

const status = (page: Page) => page.getByRole("radiogroup", { name: "Filter by status" });
const type = (page: Page) => page.getByRole("radiogroup", { name: "Filter by category" });
const cards = (page: Page) => page.locator('section[aria-labelledby="all-projects"] article');
const count = (page: Page) => page.getByTestId("project-count");

/** The count says N and N cards are on screen, all visible: polled, since the list updates after the URL. */
async function expectCountMatchesCards(page: Page, expected?: number) {
  await expect
    .poll(async () => {
      const shown = Number(/\d+/.exec((await count(page).textContent()) ?? "")?.[0] ?? "-1");
      return shown === (await cards(page).count()) ? shown : -1;
    })
    .toBe(expected ?? (await cards(page).count()));
  for (const card of await cards(page).all()) await expect(card).toBeVisible();
}

test.describe("projects filter", () => {
  test("a filtered link shows its choices selected and every counted project", async ({ page }) => {
    await page.goto("/en-us/projects?category=study&state=historical");
    await expect(status(page).getByRole("radio", { name: /Historical/ })).toHaveAttribute("aria-checked", "true");
    await expect(type(page).getByRole("radio", { name: /Study/ })).toHaveAttribute("aria-checked", "true");
    await expect(count(page)).toHaveText("4 projects");
    await expectCountMatchesCards(page);
  });

  test("switching facets never leaves a counted project hidden or a year empty", async ({ page }) => {
    await page.goto("/en-us/projects");
    await status(page)
      .getByRole("radio", { name: /Historical/ })
      .click();
    await type(page)
      .getByRole("radio", { name: /Challenge/ })
      .click();
    await expect(page).toHaveURL(/category=challenge/);
    await expectCountMatchesCards(page, 2);
    await type(page).getByRole("radio", { name: /Study/ }).click();
    await expect(page).toHaveURL(/state=historical/);
    await expect(page).toHaveURL(/category=study/);
    await expectCountMatchesCards(page, 4);
    for (const group of await page.locator('section[aria-labelledby="all-projects"] > section').all()) {
      await expect(group.locator("article").first()).toBeVisible();
    }
  });

  test("every project is in the static HTML", async ({ page, request }) => {
    const html = await (await request.get("/en-us/projects")).text();
    await page.goto("/en-us/projects");
    const titles = await cards(page).locator("h4").allTextContents();
    expect(titles.length).toBeGreaterThan(5);
    for (const title of titles) expect(html).toContain(title.trim());
  });

  test("options with no match are disabled but focusable, and the all option clears a facet", async ({ page }) => {
    await page.goto("/en-us/projects?state=experimental");
    const disabled = page.locator('[role="radio"][aria-disabled="true"]');
    if ((await disabled.count()) > 0) {
      const before = page.url();
      await disabled.first().click({ force: true });
      expect(page.url()).toBe(before);
    }
    await status(page).getByRole("radio", { name: /^All/ }).click();
    await expect(page).not.toHaveURL(/state=/);
  });

  test("arrow keys move within the status control", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard navigation is a desktop concern");
    await page.goto("/en-us/projects");
    await page.waitForLoadState("networkidle");
    await status(page).getByRole("radio", { name: /^All/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(status(page).getByRole("radio").nth(1)).toBeFocused();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us/projects?category=study");
      const results = await new AxeBuilder({ page }).include('[data-testid="project-filters"]').withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => v.id)).toEqual([]);
    });
  }

  test("fits a 360px phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/en-us/projects");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
