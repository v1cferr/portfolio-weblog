import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/*
 * The Projects page as single-choice tabs (2026-11-25). The owner's complaint
 * about the filter before it: the controls moved under the pointer (featured
 * cards above them came and went), counts changed width, the list jumped.
 */

const tabs = (page: Page) => page.getByRole("tablist", { name: "Show projects" });
const tab = (page: Page, name: RegExp) => tabs(page).getByRole("tab", { name });
const panel = (page: Page, name: RegExp) => page.getByRole("tabpanel", { name });

/** The top of the tab bar, which must never move when a tab is chosen. */
const top = async (page: Page) => (await tabs(page).boundingBox())?.y ?? Number.NaN;

test.describe("projects tabs", () => {
  test("Featured is the default and shows the featured cards", async ({ page }) => {
    await page.goto("/en-us/projects");
    await expect(tab(page, /^Featured/)).toHaveAttribute("aria-selected", "true");
    await expect(
      panel(page, /^Featured/)
        .locator("[data-slot=card]")
        .first()
    ).toBeVisible();
  });

  test("every tab sets the URL, shows its count of projects and leaves the tab bar where it was", async ({ page }) => {
    await page.goto("/en-us/projects");
    await page.waitForLoadState("networkidle");
    const before = await top(page);
    for (const [name, view] of [
      [/^All/, "all"],
      [/^Active/, "active"],
      [/^Experimental/, "experimental"],
      [/^Studies/, "study"],
      [/^Challenges/, "challenge"],
      [/^Featured/, null],
    ] as const) {
      const trigger = tab(page, name);
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-selected", "true");
      if (view === null) await expect(page).not.toHaveURL(/view=/);
      else {
        await expect(page).toHaveURL(new RegExp(`view=${view}`));
        const count = Number(/\d+/.exec((await trigger.textContent()) ?? "")?.[0] ?? "-1");
        await expect(panel(page, name).locator("article")).toHaveCount(count);
      }
      expect(await top(page)).toBe(before);
    }
  });

  test("old filter links land on the closest tab and become ?view= links", async ({ page }) => {
    await page.goto("/en-us/projects?category=study&state=historical");
    await expect(tab(page, /^Studies/)).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/\?view=study$/);
    await page.goto("/en-us/projects?state=active");
    await expect(tab(page, /^Active/)).toHaveAttribute("aria-selected", "true");
  });

  test("a technology link narrows All, with a chip that clears it in place", async ({ page }) => {
    await page.goto("/en-us/projects?tech=react");
    await expect(tab(page, /^All/)).toHaveAttribute("aria-selected", "true");
    const chip = panel(page, /^All/).getByRole("button", { name: /Using React/ });
    await expect(chip).toBeVisible();
    const before = await top(page);
    await chip.click();
    await expect(page).not.toHaveURL(/tech=/);
    expect(await top(page)).toBe(before);
  });

  test("every project is in the static HTML", async ({ page, request }) => {
    const html = await (await request.get("/en-us/projects")).text();
    await page.goto("/en-us/projects?view=all");
    await expect(tab(page, /^All/)).toHaveAttribute("aria-selected", "true");
    const titles = await panel(page, /^All/).locator("article h4").allTextContents();
    expect(titles.length).toBeGreaterThan(5);
    for (const title of titles) expect(html).toContain(title.trim());
  });

  test("arrow keys move between tabs", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard navigation is a desktop concern");
    await page.goto("/en-us/projects");
    await page.waitForLoadState("networkidle");
    await tab(page, /^Featured/).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, /^All/)).toBeFocused();
    await expect(tab(page, /^All/)).toHaveAttribute("aria-selected", "true");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us/projects?view=study");
      const results = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("fits a 360px phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/en-us/projects?view=challenge");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
