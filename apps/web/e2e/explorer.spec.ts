import AxeBuilder from "@axe-core/playwright";
import { type Browser, expect, type Locator, type Page, test } from "@playwright/test";

/**
 * The "~/" explorer: the site as a file tree. A side panel from the header on
 * desktop, a section of the menu sheet on phones. Both viewports are set per
 * test, so it runs once, in the desktop project.
 */
test.skip(({ isMobile }) => isMobile, "runs once, in the desktop project");

const POST = "/en-us/weblog/rebuilding-the-hub-content-first";
const PHONE = { viewport: { width: 360, height: 740 }, isMobile: false } as const;

/** The folder (details) below `root` whose own summary reads `name/`; not its ancestors, which contain that summary too. */
function folder(root: Locator, name: string) {
  return root.locator(`xpath=.//details[summary/span[normalize-space()="${name}/"]]`);
}

/** The post as the explorer files it: ~/weblog/2026/10/<slug>. */
function postLink(explorer: Locator) {
  const month = folder(folder(folder(explorer, "weblog"), "2026"), "10");
  return month.getByRole("link", { name: /rebuilding-the-hub-content-first/ });
}

async function openDesktop(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: "Site explorer (~/)" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog.getByRole("navigation", { name: "Site explorer" });
}

async function openPhone(browser: Browser) {
  const context = await browser.newContext(PHONE);
  return { context, page: await context.newPage() };
}

test.describe("explorer labels", () => {
  test("hides labels that only repeat the name, keeps translated ones", async ({ page }) => {
    await page.goto("/en-us");
    const en = await openDesktop(page);
    await expect(en.locator("summary", { hasText: "career/" })).toHaveText("career/");
    await page.goto("/pt-br");
    await page.getByRole("banner").getByRole("button", { name: "Explorador do site (~/)" }).click();
    const pt = page.getByRole("dialog").getByRole("navigation", { name: "Explorador do site" });
    await expect(pt.locator("summary", { hasText: "career/" })).toContainText("Carreira");
  });
});

test.describe("explorer on desktop", () => {
  test("files the post under its year and month and marks the current page", async ({ page }) => {
    await page.goto(POST);
    const explorer = await openDesktop(page);
    const link = postLink(explorer);
    // The way to the current page is open, and the page is marked.
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(link).toHaveAttribute("href", POST);
    await expect(explorer.getByRole("link", { name: /^index/ }).first()).toBeVisible();
  });

  test("its links navigate and close the panel", async ({ page }) => {
    await page.goto("/en-us");
    const explorer = await openDesktop(page);
    // Folders off the current path start closed; a click on the summary opens them.
    await folder(explorer, "projects").locator("summary").first().click();
    await explorer.getByRole("link", { name: /obsidian-rag/ }).click();
    await expect(page).toHaveURL(/\/en-us\/projects\/obsidian-rag$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("Escape closes it and gives focus back to the button", async ({ page }) => {
    await page.goto("/en-us");
    await openDesktop(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: "Site explorer (~/)" })).toBeFocused();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations while open (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(POST);
      await openDesktop(page);
      const results = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

test.describe("explorer on phones at 360px", () => {
  test("lives in the menu under the sections, opens from the keyboard, and fits", async ({ browser }) => {
    const { context, page } = await openPhone(browser);
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    // The primary navigation comes first and stays as it was.
    await expect(dialog.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Career" })).toBeVisible();
    const explorer = dialog.getByRole("navigation", { name: "Site explorer" });
    // Closed by default under the sections; Enter on a summary opens it, as with any disclosure.
    const root = explorer.locator("summary").first();
    await expect(root).toContainText("~/");
    for (const summary of [root, folder(explorer, "weblog").locator("summary").first()]) {
      await summary.focus();
      await page.keyboard.press("Enter");
    }
    await folder(folder(explorer, "weblog"), "2026").locator("summary").first().click();
    await folder(folder(folder(explorer, "weblog"), "2026"), "10")
      .locator("summary")
      .first()
      .click();
    await expect(postLink(explorer)).toBeVisible();

    // 44px touch targets for every row, and no sideways scrolling.
    const small = await explorer.evaluate((nav) =>
      [...nav.querySelectorAll<HTMLElement>("a[href], summary")]
        .filter((el) => el.checkVisibility())
        .map((el) => ({ name: el.textContent.trim(), height: Math.round(el.getBoundingClientRect().height) }))
        .filter((row) => row.height < 44)
    );
    expect(small).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const sheetOverflow = await dialog.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(sheetOverflow).toBeLessThanOrEqual(0);

    await postLink(explorer).click();
    await expect(page).toHaveURL(new RegExp(`${POST}$`));
    await expect(dialog).toBeHidden();
    await context.close();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations in the menu (${theme})`, async ({ browser }) => {
      const context = await browser.newContext({ ...PHONE, colorScheme: theme, reducedMotion: "reduce" });
      const page = await context.newPage();
      // On a post, the way to it opens as soon as ~/ does.
      await page.goto(POST);
      await page.getByRole("button", { name: "Open menu" }).click();
      const explorer = page.getByRole("dialog").getByRole("navigation", { name: "Site explorer" });
      await explorer.locator("summary").first().click();
      await expect(postLink(explorer)).toHaveAttribute("aria-current", "page");
      const results = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      await context.close();
    });
  }

  test("remembers open folders and closes with Escape", async ({ browser }) => {
    const { context, page } = await openPhone(browser);
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Open menu" }).click();
    const explorer = page.getByRole("dialog").getByRole("navigation", { name: "Site explorer" });
    await explorer.locator("summary").first().click();
    await folder(explorer, "career").locator("summary").first().click();
    await expect(explorer.getByRole("link", { name: /xmart-solutions-2024/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.reload();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("navigation", { name: "Site explorer" })
        .getByRole("link", { name: /xmart-solutions-2024/ })
    ).toBeVisible();
    await context.close();
  });
});
