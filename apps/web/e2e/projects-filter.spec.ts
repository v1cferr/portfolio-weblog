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
      [/^Professional/, "professional"],
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

/*
 * The cards (option A, 2026-11-25): a cover, the meta row, the title, one
 * line, an optional proof line and the stack as icons. One link per card.
 */
test.describe("project cards", () => {
  const card = (page: Page, title: string) =>
    panel(page, /^Featured/)
      .getByTestId("project-card")
      .filter({ has: page.getByRole("link", { name: title, exact: true }) });

  test("each card has a 16:9 cover and one line", async ({ page }) => {
    await page.goto("/en-us/projects");
    const cards = panel(page, /^Featured/).getByTestId("project-card");
    expect(await cards.count()).toBeGreaterThan(0);
    for (const item of await cards.all()) {
      const box = await item.getByTestId("project-cover").boundingBox();
      expect(box).not.toBeNull();
      if (box !== null) expect(Math.abs(box.height - (box.width * 9) / 16)).toBeLessThan(2);
      await expect(item.getByTestId("project-hook")).toBeVisible();
    }
  });

  test("a screenshot cover loads first in the first row; the hub shows its proof line", async ({ page }) => {
    await page.goto("/en-us/projects");
    const hub = card(page, "Personal Hub (v1cferr.dev)");
    const cover = hub.getByTestId("project-cover").locator("img");
    await expect(cover).toHaveAttribute("fetchpriority", "high");
    await expect(cover).not.toHaveAttribute("loading", "lazy");
    await expect(hub.getByTestId("project-hook")).toContainText("source of truth");
    await expect(hub.getByTestId("project-proof")).toContainText("65 merged PRs");
  });

  test("the stack is icons with names, each with a tooltip", async ({ page, isMobile }) => {
    test.skip(isMobile, "tooltips open on hover");
    await page.goto("/en-us/projects");
    await page.waitForLoadState("networkidle");
    const stack = card(page, "imobos").getByRole("list", { name: "Technologies" });
    const icon = stack.getByTestId("project-tech").first();
    const name = await icon.getAttribute("aria-label");
    expect(name).toBeTruthy();
    await expect(stack.getByRole("listitem")).toHaveCount(5);
    await expect(stack).toContainText(/\+\d+/);
    await icon.hover();
    await expect(page.getByRole("tooltip")).toHaveText(name ?? "");
  });

  test("the whole card is one link to the project", async ({ page }) => {
    await page.goto("/en-us/projects", { waitUntil: "networkidle" });
    const imobos = card(page, "imobos");
    await expect(imobos.getByRole("link")).toHaveCount(1);
    // A click on the text lands on the title's link, stretched over the card: `force` clicks the
    // point (once scrolled and stable) without asking the text itself to receive it.
    // Centred first: at the bottom edge the chat button floats over it on a phone.
    await imobos.evaluate((element) => {
      element.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await imobos.getByTestId("project-hook").click({ force: true });
    await expect(page).toHaveURL(/\/en-us\/projects\/imobos$/);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`the featured cards have no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us/projects", { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("the featured cards fit a 360px phone", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/pt-br/projects", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
