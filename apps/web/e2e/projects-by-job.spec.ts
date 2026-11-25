import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Projects listed under the job they were made in, and the job named on the
 * project (2026-11-25). The link is declared once, on either side.
 */

test.describe("projects by job", () => {
  test("a job lists the projects made there, and they leave Related", async ({ page }) => {
    await page.goto("/en-us/career/freelance-2024");
    const section = page.getByRole("region", { name: "Projects built here" });
    await expect(section.getByRole("link", { name: "ImobOS" }).first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Related" }).getByRole("link", { name: /ImobOS/ })).toHaveCount(0);
  });

  test("work projects sit under their jobs: FAI Meet and Inscrições vs Editais, XGuardian", async ({ page }) => {
    await page.goto("/en-us/career/fai-ufscar-2026");
    const fai = page.getByRole("region", { name: "Projects built here" });
    await expect(fai.getByRole("link", { name: "FAI Meet" }).first()).toBeVisible();
    await expect(fai.getByRole("link", { name: "Inscrições vs Editais" }).first()).toBeVisible();
    await page.goto("/en-us/career/xmart-solutions-2024");
    await expect(page.getByRole("region", { name: "Projects built here" }).getByRole("link", { name: "XGuardian" }).first()).toBeVisible();
  });

  test("a project names the job it was built at, linking back", async ({ page }) => {
    await page.goto("/en-us/projects/imobos");
    const builtAt = page.getByRole("term").filter({ hasText: "Built at" });
    await expect(builtAt).toBeVisible();
    await page
      .getByRole("definition")
      .getByRole("link", { name: /Software-AI developer/ })
      .click();
    await expect(page).toHaveURL(/\/en-us\/career\/freelance-2024$/);
  });

  test("the case study of this site shows its outcome and lessons", async ({ page }) => {
    await page.goto("/pt-br/projects/portfolio-weblog");
    await expect(page.getByText(/65 pull requests mesclados/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "O que eu mudaria" })).toBeVisible();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`a job page with projects has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us/career/freelance-2024");
      const results = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => v.id)).toEqual([]);
    });
  }
});
