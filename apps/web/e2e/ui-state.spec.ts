import { expect, type Locator, type Page, test } from "@playwright/test";

/*
 * Per-tab UI state (docs/guides/ui-state.md): a language switch keeps the
 * reader's place, query and fragment, and gives the focus back to the
 * switcher; what was unfolded stays unfolded for the tab, across reloads and
 * languages, and a new tab starts from the defaults.
 */

/** Room for the floating header and a late layout shift: the element must be where it was, give or take. */
const TOLERANCE = 80;

/**
 * Opens the language menu from the keyboard and picks a language. A
 * Playwright click would first scroll the sticky header's button "into view",
 * moving the page before the switch; a reader's click never does.
 */
async function switchTo(page: Page, language: string) {
  await page.locator("[data-locale-switcher]").evaluate((element: HTMLElement) => {
    element.focus({ preventScroll: true });
  });
  await page.keyboard.press("Enter");
  await page.getByRole("menuitemradio", { name: language }).click();
}

/** Scrolls an element to the header line, the way a deep link would, and returns its top in the viewport. */
async function scrollToElement(target: Locator): Promise<number> {
  await target.evaluate((element) => {
    element.scrollIntoView({ block: "start", behavior: "instant" });
  });
  // Let entrance animations and lazy images settle before measuring.
  await target.page().waitForTimeout(300);
  return (await target.boundingBox())?.y ?? Number.NaN;
}

async function expectAt(target: Locator, top: number) {
  await expect(target).toBeInViewport();
  await expect.poll(async () => Math.abs(((await target.boundingBox())?.y ?? Number.POSITIVE_INFINITY) - top)).toBeLessThan(TOLERANCE);
}

test.describe("a language switch keeps the reader's place", () => {
  test("on /setup, scrolled to an item in the middle", async ({ page }) => {
    await page.goto("/pt-br/setup");
    // Visible ones only: the folded VS Code extensions have no box to scroll to.
    const anchors = page.locator("main [data-anchor][id]").filter({ visible: true });
    const count = await anchors.count();
    expect(count).toBeGreaterThan(4);
    const id = await anchors.nth(Math.floor(count / 2)).getAttribute("id");
    expect(id).not.toBeNull();
    const target = page.locator(`[id="${id ?? ""}"]`);
    const top = await scrollToElement(target);
    expect(top).toBeGreaterThan(0);

    await switchTo(page, "English");
    await expect(page).toHaveURL(/\/en-us\/setup$/);
    await expectAt(target, top);
    // A restore is not a fresh deep link: nothing glows.
    await expect(target).not.toHaveAttribute("data-anchor-hit");
  });

  test("a deep link comes along without glowing again", async ({ page }) => {
    await page.goto("/pt-br/setup#mousepad-redragon-alianca");
    const target = page.locator("#mousepad-redragon-alianca");
    await expect(target).toBeInViewport();
    await page.waitForTimeout(300);
    const top = (await target.boundingBox())?.y ?? Number.NaN;

    await switchTo(page, "English");
    await expect(page).toHaveURL(/\/en-us\/setup#mousepad-redragon-alianca$/);
    await expectAt(target, top);
    await expect(target).not.toHaveAttribute("data-anchor-hit");
  });

  test("on /about, at the recommendations", async ({ page }) => {
    await page.goto("/pt-br/about");
    const target = page.locator("#recommendation-marcius-leandro");
    const top = await scrollToElement(target);

    await switchTo(page, "English");
    await expect(page).toHaveURL(/\/en-us\/about$/);
    await expectAt(target, top);
  });

  test("gives the focus back to the switcher", async ({ page }) => {
    await page.goto("/pt-br/about");
    await switchTo(page, "English");
    await expect(page).toHaveURL(/\/en-us\/about$/);
    await expect(page.locator("[data-locale-switcher]")).toBeFocused();
  });

  test("keeps the query and the fragment on /projects", async ({ page }) => {
    await page.goto("/pt-br/projects?view=all#uncurated");
    await expect(page.getByRole("tab", { selected: true })).toHaveAttribute("data-state", "active");
    await switchTo(page, "English");
    await expect(page).toHaveURL(/\/en-us\/projects\?view=all#uncurated$/);
    // The All tab is still the chosen one.
    await expect(page.getByRole("tab", { name: /All/, selected: true })).toBeVisible();
  });

  test("a tab change on /projects keeps the fragment", async ({ page }) => {
    await page.goto("/en-us/projects#uncurated");
    await page.getByRole("tab", { name: /All/ }).click();
    await expect(page).toHaveURL(/\/en-us\/projects\?view=all#uncurated$/);
  });
});

test.describe("unfolded stays unfolded for the tab", () => {
  const LATE_PT = "Estou certo de que ele será um ativo valioso";

  test("Read all survives a language switch and a reload, not a new tab", async ({ page, browser }) => {
    await page.goto("/pt-br/about");
    const marcius = page.locator("#recommendation-marcius-leandro");
    await marcius.getByRole("button", { name: "Ler tudo" }).click();
    await expect(marcius.getByText(LATE_PT)).toBeVisible();

    await switchTo(page, "English");
    await expect(page).toHaveURL(/\/en-us\/about$/);
    await expect(marcius.getByRole("button", { name: "Show less" })).toBeVisible();

    await page.reload();
    await expect(marcius.getByRole("button", { name: "Show less" })).toBeVisible();

    // A new tab is a new visit: sessionStorage is per tab, so it starts folded.
    const context = await browser.newContext();
    const fresh = await context.newPage();
    await fresh.goto("/pt-br/about");
    const card = fresh.locator("#recommendation-marcius-leandro");
    await expect(card.getByRole("button", { name: "Ler tudo" })).toBeVisible();
    await expect(card.getByText(LATE_PT)).toBeHidden();
    await context.close();
  });

  test("case-study decisions stay as they were left, in every language", async ({ page }) => {
    await page.goto("/en-us/projects/portfolio-weblog");
    const decisions = page.locator("section[aria-labelledby=decisions] details");
    const [first, second] = [decisions.nth(0), decisions.nth(1)];
    await expect(first).toHaveAttribute("open", "");
    // Close the first (open by default) and open the second.
    await first.locator("summary").click();
    await second.locator("summary").click();
    await expect(first).not.toHaveAttribute("open");
    await expect(second).toHaveAttribute("open", "");

    await page.reload();
    await expect(first).not.toHaveAttribute("open");
    await expect(second).toHaveAttribute("open", "");

    await switchTo(page, "Português");
    await expect(page).toHaveURL(/\/pt-br\/projects\/portfolio-weblog$/);
    await expect(first).not.toHaveAttribute("open");
    await expect(second).toHaveAttribute("open", "");
  });
});
