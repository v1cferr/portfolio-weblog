import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { auditThemeOnce } from "./axe-theme";

/*
 * The optional long-form story of a job (2026-11-25), first written for
 * Xmart Solutions. Jobs without a story have no link and no /story page.
 */

const STORY = "/career/xmart-solutions-2024/story";

test.describe("job story", () => {
  test("the job page links to its story", async ({ page }) => {
    await page.goto("/en-us/career/xmart-solutions-2024");
    await page.getByRole("link", { name: "Read the full story" }).click();
    await expect(page).toHaveURL(new RegExp(`/en-us${STORY}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("XGuardian, my first job as a developer");
  });

  test("the story renders in English with its sections and sources", async ({ page }) => {
    await page.goto(`/en-us${STORY}`);
    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Xmart Solutions" })).toBeVisible();
    await expect(breadcrumb.getByText("Story", { exact: true })).toBeVisible();
    for (const name of ["The problem", "My role, in three positions", "What I worked on", "What I learned", "Sources"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "XGuardian website" })).toHaveAttribute("href", "https://www.xguardianplatform.io/");
    await expect(page.getByText(/\d+ min/)).toBeVisible();
    // The owner's notes are MDX comments and never reach the page.
    await expect(page.getByText("OWNER:")).toHaveCount(0);
  });

  test("the story renders in Portuguese", async ({ page }) => {
    await page.goto("/pt-br/career/xmart-solutions-2024");
    await expect(page.getByRole("link", { name: "Ler a história completa" })).toBeVisible();
    await page.goto(`/pt-br${STORY}`);
    for (const name of ["O problema", "Meu papel, em três cargos", "O que aprendi", "Fontes"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Site do XGuardian" })).toHaveAttribute("href", "https://www.xguardianplatform.io/");
  });

  test("a job without a story has no link, and its /story is not found", async ({ page }) => {
    await page.goto("/en-us/career/amcor-2021");
    await expect(page.getByRole("link", { name: "Read the full story" })).toHaveCount(0);
    const response = await page.goto("/en-us/career/amcor-2021/story");
    expect(response?.status()).toBe(404);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`the story has no serious axe violations (${theme})`, async ({ page }) => {
      auditThemeOnce(theme);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(`/en-us${STORY}`);
      const results = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => v.id)).toEqual([]);
    });
  }

  test("the story does not scroll sideways at 360px", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    await page.goto(`/pt-br${STORY}`, { waitUntil: "load" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
    await context.close();
  });
});
