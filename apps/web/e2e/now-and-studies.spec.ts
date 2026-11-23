import { expect, type Page, test } from "@playwright/test";

/*
 * The home page's Now card and Learning strip, the /now log and the /next
 * plans. Dates are checked through their <time> elements, so the tests hold
 * as the content gains updates.
 */

async function jsonLd(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
}

test.describe("home: now and learning", () => {
  test("shows the Now card after the hero, with a few bullets and the date of the update", async ({ page }) => {
    await page.goto("/en-us");
    const sections = page.locator("main section");
    // The hero stays first; the Now card follows it, then the Learning strip.
    await expect(sections.nth(1)).toHaveAttribute("aria-labelledby", "now");
    await expect(sections.nth(2)).toHaveAttribute("aria-labelledby", "learning");

    const card = page.locator('section[aria-labelledby="now"]');
    await expect(card.getByRole("heading", { level: 2, name: "Now" })).toBeVisible();
    const bullets = card.getByRole("list", { name: "Now" }).getByRole("listitem");
    expect(await bullets.count()).toBeGreaterThanOrEqual(3);
    expect(await bullets.count()).toBeLessThanOrEqual(5);
    // The owner's words, then what the content says.
    await expect(bullets.first()).toContainText("NixOS");
    await expect(card).toContainText("Working as AI Systems Analyst");
    await expect(card.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
    // "Updated <date>", or only the date next to "last updated N days ago" once the log is stale.
    await expect(card.locator("time")).toHaveText(/^(Updated )?\w{3} \d{1,2}, \d{4}$/);
    await expect(card.getByRole("link", { name: "Full log" })).toHaveAttribute("href", "/en-us/now");
    await expect(card.getByRole("link", { name: "What comes next" })).toHaveAttribute("href", "/en-us/next");
  });

  test("localizes the card and its date", async ({ page }) => {
    await page.goto("/pt-br");
    const card = page.locator('section[aria-labelledby="now"]');
    await expect(card.getByRole("heading", { level: 2, name: "Agora" })).toBeVisible();
    await expect(card).toContainText("Escrevendo no weblog");
    await expect(card.locator("time")).toHaveText(/^(Atualizado em )?\d{1,2} de \S+ de \d{4}$/);
  });

  test("shows the Learning strip with credentials and a link to the Studies page", async ({ page }) => {
    await page.goto("/en-us");
    const strip = page.locator('section[aria-labelledby="learning"]');
    await expect(strip.getByRole("heading", { level: 2, name: "Learning" })).toBeVisible();
    const tiles = strip.getByRole("list", { name: "Studies and credentials" }).getByRole("listitem");
    expect(await tiles.count()).toBeGreaterThanOrEqual(1);
    expect(await tiles.count()).toBeLessThanOrEqual(4);
    await expect(tiles.first().getByRole("heading", { level: 3 })).toBeVisible();
    await expect(tiles.first().locator("time")).toBeVisible();
    await expect(strip.getByRole("link", { name: "All studies" })).toHaveAttribute("href", "/en-us/education");
  });
});

test.describe("now and next pages", () => {
  test("/now shows the newest update, dated, with JSON-LD that matches the date", async ({ page }) => {
    await page.goto("/en-us/now");
    await expect(page.getByRole("heading", { level: 1, name: "Now" })).toBeVisible();
    const latest = page.locator("article[aria-labelledby='latest-update']");
    const date = await latest.getByRole("heading", { level: 2 }).locator("time").getAttribute("datetime");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(latest.getByRole("list", { name: "Now" }).getByRole("listitem").first()).toContainText("NixOS");
    const [graph] = await jsonLd(page);
    expect(graph?.["@type"]).toBe("WebPage");
    expect(graph?.dateModified).toBe(date);
    await expect(page.getByRole("link", { name: "What comes next" })).toHaveAttribute("href", "/en-us/next");
  });

  test("/next lists the plans with their date and links back to /now", async ({ page }) => {
    await page.goto("/pt-br/next");
    await expect(page.getByRole("heading", { level: 1, name: "Próximos passos" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "flake Nix" })).toBeVisible();
    const date = await page.locator("main time").first().getAttribute("datetime");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [graph] = await jsonLd(page);
    expect(graph?.dateModified).toBe(date);
    await expect(page.getByRole("link", { name: "O que estou fazendo agora" })).toHaveAttribute("href", "/pt-br/now");
  });

  test("the footer and the About page link to both", async ({ page }) => {
    await page.goto("/en-us/about");
    for (const scope of [page.getByRole("contentinfo"), page.getByRole("main")]) {
      expect(await scope.locator('a[href="/en-us/now"]').count()).toBeGreaterThan(0);
      expect(await scope.locator('a[href="/en-us/next"]').count()).toBeGreaterThan(0);
    }
  });

  test("the sitemap lists them with the date they show", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    expect(body).toMatch(/<loc>[^<]*\/en-us\/now<\/loc>(?:\s*<xhtml:link[^>]*>)*\s*<lastmod>\d{4}-\d{2}-\d{2}/);
    expect(body).toMatch(/<loc>[^<]*\/en-us\/next<\/loc>(?:\s*<xhtml:link[^>]*>)*\s*<lastmod>\d{4}-\d{2}-\d{2}/);
  });
});

test.describe("studies", () => {
  test("groups degrees before courses, and has no empty certifications heading", async ({ page }) => {
    await page.goto("/en-us/education");
    const headings = await page.getByRole("main").getByRole("heading", { level: 2 }).allTextContents();
    expect(headings.indexOf("Degrees")).toBeLessThan(headings.indexOf("Courses and programs"));
    expect(headings.indexOf("Degrees")).toBeGreaterThanOrEqual(0);
    // Production hides the certifications group while it is empty.
    if (headings.includes("Certifications")) expect(await page.locator("#certifications li").count()).toBeGreaterThan(0);
  });

  test("the person's JSON-LD lists the completed degree as a credential", async ({ page }) => {
    await page.goto("/en-us");
    const [home] = await jsonLd(page);
    const person = ((home?.["@graph"] ?? []) as Record<string, unknown>[]).find((node) => node["@type"] === "Person");
    expect(person?.hasCredential).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "degree",
          recognizedBy: expect.objectContaining({ name: "UNIASSELVI" }),
        }),
      ])
    );
  });
});
