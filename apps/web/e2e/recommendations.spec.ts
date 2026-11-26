import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * LinkedIn recommendations (content/recommendations), in the owner's rank: the
 * first three quoted on the home page, all six in full on About, and the ones from a job on its page.
 */

const LINKEDIN = "https://www.linkedin.com/in/v1cferr/details/recommendations/";
/** The owner's order of importance (rank in the YAML). */
const RANKED = [
  "julio-cesar-raveli",
  "rian-ramos-gomes",
  "marcius-leandro",
  "leonardo-galis-noronha",
  "mateus-lima-bispo",
  "joao-victor-sitta",
];
const FEATURED = RANKED.slice(0, 3);

test.describe("recommendations", () => {
  test("the home page features three, in the owner's order, linking to LinkedIn and to all of them", async ({ page }) => {
    await page.goto("/pt-br");
    const section = page.locator("section[aria-labelledby=recommendations]");
    await expect(section.getByRole("heading", { level: 2, name: "Recomendações" })).toBeVisible();
    const cards = section.locator("[data-recommendation]");
    await expect(cards).toHaveCount(3);
    expect(await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-recommendation")))).toEqual(FEATURED);

    const first = cards.first();
    await expect(first.locator("blockquote")).toHaveAttribute("lang", "pt-br");
    await expect(first).toContainText("um pesquisador nato");
    await expect(first).toContainText("meu gestor direto na Xmart");
    await expect(first.locator("[data-translated]")).toHaveCount(0);
    const linkedin = first.getByRole("link", { name: /Ver no LinkedIn/ });
    await expect(linkedin).toHaveAttribute("href", LINKEDIN);
    await expect(linkedin).toHaveAttribute("target", "_blank");
    // The official LinkedIn logo, in its colour, before the text.
    await expect(linkedin.locator(".brand-tint")).toBeVisible();

    await section.getByRole("link", { name: /Ver as 6/ }).click();
    await expect(page).toHaveURL(/\/pt-br\/about#recommendations$/);
    await expect(page.locator("[data-recommendation]")).toHaveCount(6);
  });

  test("English shows translations, labelled as such", async ({ page }) => {
    await page.goto("/en-us");
    const first = page.locator("section[aria-labelledby=recommendations] [data-recommendation]").first();
    await expect(first.locator("blockquote")).toHaveAttribute("lang", "en-us");
    await expect(first).toContainText("a born researcher");
    await expect(first.locator("[data-translated]")).toHaveText("Translated from Portuguese");
  });

  test("About has all six in full, in the owner's order, long ones behind Read all", async ({ page }) => {
    await page.goto("/pt-br/about");
    const cards = page.locator("[data-recommendation]");
    await expect(cards).toHaveCount(6);
    expect(await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-recommendation")))).toEqual(RANKED);
    for (const card of await cards.all()) await expect(card.locator("[data-slot=avatar]")).toBeVisible();

    const marcius = page.locator("#recommendation-marcius-leandro");
    const late = "Estou certo de que ele será um ativo valioso";
    await expect(marcius.getByText(late)).toBeHidden();
    await marcius.getByRole("button", { name: "Ler tudo" }).click();
    await expect(marcius.getByText(late)).toBeVisible();
    await marcius.getByRole("button", { name: "Mostrar menos" }).click();
    await expect(marcius.getByText(late)).toBeHidden();

    // A short one is shown whole, with no "Read all" (only its copy-link button).
    await expect(page.locator("#recommendation-julio-cesar-raveli").getByRole("button", { name: "Ler tudo" })).toHaveCount(0);
  });

  test("About reads by rows on wide screens: the first two side by side", async ({ page, isMobile }) => {
    test.skip(isMobile, "one column on phones");
    await page.goto("/pt-br/about");
    const [first, second] = await Promise.all(RANKED.slice(0, 2).map((id) => page.locator(`#recommendation-${id}`).boundingBox()));
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 1))).toBeLessThan(2);
    expect(second?.x ?? 0).toBeGreaterThan(first?.x ?? 0);
  });

  test("a job page lists the recommendations from that period", async ({ page }) => {
    await page.goto("/en-us/career/xmart-solutions-2024");
    const section = page.locator("section[aria-labelledby=recommendations-here]");
    await expect(section.getByRole("heading", { name: "Recommendations from this period" })).toBeVisible();
    await expect(section.getByRole("link")).toHaveCount(3);
    await section.getByRole("link", { name: /Júlio César Raveli/ }).click();
    await expect(page).toHaveURL(/\/en-us\/about#recommendation-julio-cesar-raveli$/);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      for (const path of ["/pt-br", "/en-us/about"]) {
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .include("section[aria-labelledby=recommendations]")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      }
    });
  }

  test("fits a 360px phone", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page = await context.newPage();
    for (const path of ["/pt-br", "/en-us", "/pt-br/about", "/en-us/about"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
});
