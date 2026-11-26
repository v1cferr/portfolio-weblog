import { expect, test } from "@playwright/test";

/*
 * Entries brought over from LinkedIn on 2026-11-25: three projects, two
 * studies, a test score, the English level and volunteering. Volunteering is
 * kept apart from the career: a section on About and its own label on the
 * timeline, never a card on /career.
 */

test.describe("volunteering", () => {
  test("About lists it newest first, with what I did behind an i", async ({ page }) => {
    await page.goto("/en-us/about");
    const section = page.getByTestId("about-volunteering");
    await expect(section.getByRole("heading", { level: 2, name: "Volunteering" })).toBeVisible();
    const items = section.getByRole("listitem");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("Community Volunteer");
    await expect(items.nth(0)).toContainText("Prefeitura Municipal de São Carlos");
    await expect(items.nth(0)).toContainText("Poverty alleviation");
    await expect(items.nth(1)).toContainText("IT Support Volunteer");
    await expect(items.nth(1)).toContainText("MAPS S.A.");

    const note = "food packages";
    await expect(section.getByText(note, { exact: false })).toHaveCount(0);
    await items.nth(0).getByRole("button", { name: "What I did as Community Volunteer" }).click();
    await expect(page.getByText(note, { exact: false })).toBeVisible();
  });

  test("is translated", async ({ page }) => {
    await page.goto("/pt-br/about");
    const section = page.getByTestId("about-volunteering");
    await expect(section.getByRole("heading", { level: 2, name: "Voluntariado" })).toBeVisible();
    await expect(section).toContainText("Voluntário comunitário");
    await expect(section).toContainText("Combate à pobreza");
  });

  test("stays off the career page", async ({ page }) => {
    await page.goto("/en-us/career");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("MAPS S.A.");
    await expect(page.locator("main")).not.toContainText("Prefeitura Municipal de São Carlos");
  });

  test("shows on the timeline with its own label and no link", async ({ page }) => {
    await page.goto("/en-us/timeline");
    const row = page.getByRole("region", { name: "Timeline" }).locator("li, div").filter({ hasText: "IT Support Volunteer" }).last();
    await expect(row).toContainText("Volunteering");
    await expect(row).toContainText("MAPS S.A.");
    await expect(row.getByRole("link")).toHaveCount(0);
  });
});

test.describe("projects from LinkedIn", () => {
  for (const [id, title, text] of [
    ["spendflow", "SpendFlow", "with a collaborator"],
    ["debtview", "DebtView", "team of six"],
    ["ip-address-tracker", "IP Address Tracker", "interactive map"],
  ] as const) {
    test(`${title} has its page`, async ({ page }) => {
      await page.goto(`/en-us/projects/${id}`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.locator("main")).toContainText(text);
    });
  }

  test("DebtView is linked from the Senac study", async ({ page }) => {
    await page.goto("/en-us/education");
    await expect(page.locator("#senac-systems-programmer").getByRole("link", { name: "debtview" })).toHaveAttribute(
      "href",
      "/en-us/projects/debtview"
    );
  });
});

test.describe("studies and languages from LinkedIn", () => {
  test("the Studies page lists the Hackers do Bem program, the LGPD course and the GTI score", async ({ page }) => {
    await page.goto("/en-us/education");
    await expect(page.locator("#hackers-do-bem-cybersecurity")).toContainText("Federal Cybersecurity Program");
    await expect(page.locator("#hackers-do-bem-cybersecurity")).toContainText("Hackers do Bem");
    await expect(page.locator("#senai-privacy-data-protection")).toContainText("Privacy and Data Protection (LGPD)");
    await expect(page.locator("#uniasselvi-gti")).toContainText("9.5/10");
  });

  test("About shows English at a professional level", async ({ page }) => {
    await page.goto("/pt-br/about");
    const languages = page.locator('section[aria-labelledby="languages"]');
    await expect(languages).toContainText("Profissional");
    await expect(languages).not.toContainText("Intermediário");
  });
});
