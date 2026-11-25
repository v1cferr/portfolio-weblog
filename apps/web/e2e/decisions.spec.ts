import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * The decision log: docs/decisions/ as public pages. The list shows every
 * record newest first with why it matters; a record's page renders its
 * Markdown, with links to other records kept on the site.
 */

const LIST = "/en-us/decisions";
const RECORD = "/en-us/decisions/0011";

test.describe("decision log", () => {
  test("lists the 15 records by number, newest first, with status, date and summary", async ({ page }) => {
    await page.goto(LIST);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "Decision log" })).toBeVisible();
    const entries = main.getByRole("list", { name: "Decisions, newest first" }).locator(":scope > li");
    expect(await entries.count()).toBeGreaterThanOrEqual(15);
    const numbers = await entries.evaluateAll((items) => items.map((item) => /ADR (\d{4})/.exec(item.textContent)?.[1] ?? ""));
    expect(numbers.slice(-15)).toEqual(Array.from({ length: 15 }, (_, i) => String(15 - i).padStart(4, "0")));

    const last = entries.last();
    await expect(last.getByRole("heading", { level: 2 })).toHaveText("Structured content in Git is the source of truth");
    await expect(last.getByText("Accepted", { exact: true })).toBeVisible();
    await expect(last.locator("time")).toHaveAttribute("datetime", "2026-10-09");
    await expect(last).toContainText("Every fact the site states lives in plain files in Git");

    // 0004 is partly superseded; the note links to the records that did it.
    const partial = entries.filter({ hasText: "ADR 0004" });
    await expect(partial).toContainText("Partly superseded by");
    await expect(partial.getByRole("link", { name: "0015" })).toHaveAttribute("href", "/en-us/decisions/0015");
  });

  test("opens a record with its title, summary, body and a GitHub link", async ({ page }) => {
    await page.goto(LIST);
    await page.getByRole("link", { name: "A profile chat that answers only from the site's pages" }).click();
    await expect(page).toHaveURL(RECORD);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "A profile chat that answers only from the site's pages" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Why it matters" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Context" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: /Revision \(2026-11-23/ })).toBeVisible();
    await expect(main.getByRole("table")).toBeVisible();
    await expect(main.getByRole("link", { name: /View on GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/v1cferr/portfolio-weblog/blob/main/docs/decisions/0011-profile-chat.md"
    );
    // English pages need no language notice.
    await expect(main.getByText(/is not available in/)).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Decision log" })).toHaveAttribute("href", "/en-us/decisions");
  });

  test("keeps a link to another record on the site", async ({ page }) => {
    await page.goto(RECORD);
    const link = page.getByRole("main").locator(".prose-hub").getByRole("link", { name: "0006" });
    await expect(link).toHaveAttribute("href", "/en-us/decisions/0006");
    await expect(link).not.toHaveAttribute("target");
    await link.click();
    await expect(page).toHaveURL("/en-us/decisions/0006");
    await expect(page.getByRole("heading", { level: 1, name: "Local text search before any AI layer" })).toBeVisible();
  });

  test("in Portuguese, the summaries are translated and a record says it is in English", async ({ page }) => {
    await page.goto("/pt-br/decisions");
    await expect(page.getByRole("heading", { level: 1, name: "Registro de decisões" })).toBeVisible();
    await expect(page.getByRole("main")).toContainText("Todo fato que o site afirma fica em arquivos simples no Git");

    await page.goto("/pt-br/decisions/0004");
    const main = page.getByRole("main");
    await expect(main.getByText("Este texto ainda não está disponível em Português", { exact: false })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Por que importa" })).toBeVisible();
    await expect(main.getByRole("link", { name: /Ver no GitHub/ })).toBeVisible();
    await expect(main.locator(".prose-hub").getByRole("link", { name: "0008" })).toHaveAttribute("href", "/pt-br/decisions/0008");
  });

  test("is linked from the footer, not the main navigation", async ({ page }) => {
    await page.goto("/en-us");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Decisions" })).toHaveAttribute("href", "/en-us/decisions");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Decisions" })).toHaveCount(0);
  });

  test("the colophon's ADR links open the decision log", async ({ page }) => {
    for (const [locale, name] of [
      ["en-us", /^0006 · Local text search/],
      ["pt-br", /^0006 · Busca local/],
    ] as const) {
      await page.goto(`/${locale}/colophon`);
      const link = page.getByRole("main").getByRole("link", { name });
      await expect(link).toHaveAttribute("href", `/${locale}/decisions/0006`);
      await expect(link).not.toHaveAttribute("target");
    }
  });

  test("an unknown record is a 404", async ({ page }) => {
    const response = await page.goto("/en-us/decisions/9999");
    expect(response?.status()).toBe(404);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      for (const path of [LIST, RECORD, "/pt-br/decisions/0007"]) {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      }
    });
  }

  test("fits a 360px phone", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page = await context.newPage();
    for (const path of [LIST, "/pt-br/decisions", RECORD, "/en-us/decisions/0007", "/pt-br/decisions/0004"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
});
