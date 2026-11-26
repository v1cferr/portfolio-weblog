import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/*
 * The 2025 move to São Carlos is a career break: a marker on the timeline's
 * career lane, never a job on /career. The Xmart freelance position went on
 * during it, which the marker's "i" and that position's note both say.
 */

const row = (page: Page, title: string, region = "Timeline") =>
  page.getByRole("region", { name: region }).locator("li, div").filter({ hasText: title }).last();

test.describe("career break", () => {
  test("shows on the timeline with its own label, the move and no link", async ({ page }) => {
    await page.goto("/en-us/timeline");
    const entry = row(page, "Moved to São Carlos");
    await expect(entry).toContainText("Career break");
    await expect(entry).toContainText("Ribeirão Pires, SP → São Carlos, SP");
    await expect(entry.getByRole("link")).toHaveCount(0);

    const detail = "portfolio work";
    await expect(page.getByText(detail, { exact: false })).toHaveCount(0);
    await entry.getByRole("button", { name: "More about Moved to São Carlos" }).click();
    await expect(page.getByText(detail, { exact: false })).toBeVisible();
    await expect(page.getByText("At the same time: Software Developer · Xmart Solutions.")).toBeVisible();
  });

  test("is translated", async ({ page }) => {
    await page.goto("/pt-br/timeline");
    const entry = row(page, "Mudança para São Carlos", "Linha do tempo");
    await expect(entry).toContainText("Pausa na carreira");
    await entry.getByRole("button", { name: "Mais sobre Mudança para São Carlos" }).click();
    await expect(page.getByText("Ao mesmo tempo: Desenvolvedor de software · Xmart Solutions.")).toBeVisible();
  });

  test("stays off the career page, and the Xmart freelance note mentions it", async ({ page }) => {
    await page.goto("/en-us/career");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Moved to São Carlos");

    await page.goto("/en-us/career/xmart-solutions-2024");
    await expect(page.locator("main")).toContainText("while I moved to São Carlos");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`the timeline has no serious axe violations with the details open (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us/timeline");
      await row(page, "Moved to São Carlos").getByRole("button", { name: "More about Moved to São Carlos" }).click();
      const results = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => v.id)).toEqual([]);
    });
  }

  test("the timeline does not scroll sideways at 360px", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    await page.goto("/pt-br/timeline", { waitUntil: "load" });
    await row(page, "Mudança para São Carlos", "Linha do tempo")
      .getByRole("button", { name: "Mais sobre Mudança para São Carlos" })
      .click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
    await context.close();
  });
});

test("MAPS S.A. shows its official logo", async ({ page }) => {
  await page.goto("/en-us/about");
  const mark = page.getByTestId("about-volunteering").locator('[data-organization="maps-sa"] img');
  await expect(mark).toHaveAttribute("src", "/company-logos/maps-sa.svg");
  expect(await mark.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});
