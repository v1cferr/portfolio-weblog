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
    const items = section.locator(":scope > ul > li");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("Community Volunteer");
    await expect(items.nth(0)).toContainText("Prefeitura Municipal de São Carlos");
    await expect(items.nth(0)).toContainText("Poverty alleviation");
    await expect(items.nth(1)).toContainText("IT Support Volunteer");
    await expect(items.nth(1)).toContainText("MAPS S.A.");

    const note = "donation logistics";
    await expect(section.getByText(note, { exact: false })).toHaveCount(0);
    await items.nth(0).getByRole("button", { name: "What I did as Community Volunteer" }).click();
    await expect(page.getByText(note, { exact: false })).toBeVisible();
  });

  test("shows the photos an entry has, and none for one without", async ({ page }) => {
    await page.goto("/en-us/about");
    const items = page.getByTestId("about-volunteering").locator(":scope > ul > li");
    await expect(items.nth(0).getByRole("img", { name: /food packages/i })).toBeVisible();
    await expect(items.nth(0).getByRole("img", { name: /volunteers standing together/i })).toBeVisible();
    await expect(items.nth(1).getByRole("img")).toHaveCount(0); // its logo is decorative
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

test.describe("official logos of the LinkedIn organizations", () => {
  for (const [path, entry, id, src] of [
    ["/en-us/education", "#hackers-do-bem-cybersecurity", "hackers-do-bem", "/company-logos/hackers-do-bem.svg"],
    ["/en-us/education", "#senai-privacy-data-protection", "senai", "/company-logos/senai.svg"],
    ["/en-us/about", '[data-testid="about-volunteering"]', "prefeitura-sao-carlos", "/company-logos/prefeitura-sao-carlos.png"],
  ] as const) {
    test(`${id} shows its logo, not initials`, async ({ page }) => {
      await page.goto(path);
      const logo = page.locator(`${entry} [data-organization="${id}"] img`).first();
      await expect(logo).toHaveAttribute("src", src);
      // The image loaded: a broken path would leave it at zero width.
      expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    });
  }

  test("the navy Hackers do Bem and SENAI marks switch to their dark-theme variants", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/en-us/education");
    for (const id of ["hackers-do-bem", "senai"]) {
      const mark = page.locator(`[data-organization="${id}"]`).first();
      await expect(mark.locator(`img[src="/company-logos/${id}-dark.svg"]`)).toBeVisible();
      await expect(mark.locator(`img[src="/company-logos/${id}.svg"]`)).toBeHidden();
    }
  });

  // Freelance work has no organization, so no logo: its initials are expected.
  test("no organization mark falls back to initials", async ({ page }) => {
    for (const path of ["/en-us/education", "/en-us/about", "/en-us/career", "/en-us/timeline"]) {
      await page.goto(path);
      await expect(page.locator("[data-organization]").first()).toBeAttached();
      await expect(page.locator('[data-organization]:not([data-organization="independent"]):not(:has(img))'), path).toHaveCount(0);
    }
  });
});
