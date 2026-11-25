import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Project case studies (ADR 0014): the TL;DR card first, then the deep dive
 * with decisions as <details>. A project without a case study keeps its old
 * page. portfolio-weblog is the reference case study; obsidian-rag has none.
 */

const CASE_STUDY = "/en-us/projects/portfolio-weblog";

test.describe("case study page", () => {
  test("opens with the TL;DR, then the deep dive with its decisions", async ({ page }) => {
    await page.goto(CASE_STUDY);
    const main = page.getByRole("main");
    const headings = await main.getByRole("heading", { level: 2 }).allTextContents();
    expect(headings[0]).toBe("TL;DR");
    expect(headings.indexOf("Key decisions")).toBeGreaterThan(0);
    expect(headings.indexOf("Why I built it")).toBeLessThan(headings.indexOf("Key decisions"));
    expect(headings.indexOf("How it was built")).toBeGreaterThan(headings.indexOf("Key decisions"));
    // Lessons come last of the written sections, after the decisions.
    expect(headings.indexOf("What I would change")).toBeGreaterThan(headings.indexOf("Key decisions"));

    const tldr = main.locator("[aria-labelledby=tldr]");
    await expect(tldr.getByText("Problem", { exact: true })).toBeVisible();
    await expect(tldr.getByText("Role", { exact: true })).toBeVisible();
    await expect(tldr.getByText("Outcome", { exact: true })).toBeVisible();
    await expect(tldr.getByRole("list", { name: "Technologies" })).toBeVisible();
    await expect(tldr.getByRole("link", { name: /ADRs/ })).toHaveAttribute("href", /\/docs\/decisions$/);
  });

  test("decisions are <details>: the first open, the others toggle", async ({ page }) => {
    await page.goto(CASE_STUDY);
    const decisions = page.locator("section[aria-labelledby=decisions] details");
    expect(await decisions.count()).toBeGreaterThanOrEqual(1);
    expect(await decisions.count()).toBeLessThanOrEqual(3);
    const first = decisions.first();
    await expect(first).toHaveAttribute("open", "");
    await expect(first).toContainText("Chose");
    await expect(first).toContainText("Cost:");
    await expect(first.getByRole("link", { name: /Read the ADR/ })).toHaveAttribute("href", /docs\/decisions\/0001-content-first\.md$/);

    const second = decisions.nth(1);
    await expect(second).not.toHaveAttribute("open");
    await second.locator("summary").click();
    await expect(second).toHaveAttribute("open", "");
    await expect(second.getByRole("link", { name: /Read the ADR/ })).toBeVisible();
    await second.locator("summary").click();
    await expect(second).not.toHaveAttribute("open");
  });

  test("is localized", async ({ page }) => {
    await page.goto("/pt-br/projects/portfolio-weblog");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 2, name: "Resumo" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Decisões-chave" })).toBeVisible();
    await expect(main.locator("details").first()).toContainText("Escolhi");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(CASE_STUDY);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("fits a 360px phone with every decision open", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page = await context.newPage();
    for (const path of [CASE_STUDY, "/en-us/projects/dotfiles", "/en-us/projects/imobos", "/pt-br/projects/imobos"]) {
      await page.goto(path);
      await page.locator("details").evaluateAll((all) => {
        for (const details of all) (details as HTMLDetailsElement).open = true;
      });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
});

test.describe("projects without a case study", () => {
  test("keep their page as it was", async ({ page }) => {
    await page.goto("/en-us/projects/obsidian-rag");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "obsidian-rag" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "TL;DR" })).toHaveCount(0);
    await expect(main.locator("details")).toHaveCount(0);
    await expect(main.getByRole("heading", { level: 2, name: "Technologies" })).toBeVisible();
  });
});

test.describe("projects list", () => {
  test("featured cards show the problem and a case study badge", async ({ page }) => {
    await page.goto("/en-us/projects");
    const featured = page.getByRole("tabpanel", { name: /Featured/ });
    const card = featured.locator("[data-slot=card]").filter({ has: page.getByRole("link", { name: "Personal Hub (v1cferr.dev)" }) });
    await expect(card.getByText("Case study", { exact: true })).toBeVisible();
    await expect(card).toContainText("source of truth");
    // obsidian-rag is listed, but no longer featured.
    await expect(featured.getByRole("link", { name: "obsidian-rag" })).toHaveCount(0);
    await page.getByRole("tab", { name: /^All/ }).click();
    await expect(page.getByRole("tabpanel", { name: /^All/ }).getByRole("link", { name: "obsidian-rag" })).toBeVisible();
  });

  test("acuttis-point is private: no card and no page", async ({ page }) => {
    await page.goto("/en-us/projects");
    await expect(page.getByRole("main").getByRole("link", { name: "acuttis-point" })).toHaveCount(0);
    const response = await page.goto("/en-us/projects/acuttis-point");
    expect(response?.status()).toBe(404);
  });
});
