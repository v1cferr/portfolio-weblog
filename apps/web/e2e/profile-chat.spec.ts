import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * The profile chat (ADR 0011) as CI sees it: no ANTHROPIC_API_KEY, so every
 * answer is the extractive fallback. Nothing external is mocked; this is the
 * path local development, CI and an outage all take.
 */

async function openAsk(page: Page) {
  await page.getByRole("button", { name: "Ask about Victor" }).click();
  const dialog = page.getByRole("dialog", { name: "Ask about Victor" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("profile chat", () => {
  test("the header button opens the dialog in Ask mode, with focus in the question box", async ({ page }) => {
    await page.goto("/en-us");
    const dialog = await openAsk(page);
    await expect(dialog.getByRole("tab", { name: "Ask" })).toHaveAttribute("aria-selected", "true");
    await expect(dialog.getByRole("textbox", { name: "Ask about Victor" })).toBeFocused();
    await expect(dialog.getByRole("button", { name: "What is Victor's current role?" })).toBeVisible();
  });

  test("a suggested question gets the site's passages, labelled, with links to the pages", async ({ page }) => {
    await page.goto("/en-us");
    const dialog = await openAsk(page);
    await dialog.getByRole("button", { name: "Which RAG projects has Victor built?" }).click();
    const answer = dialog.getByTestId("ask-extractive");
    await expect(answer).toBeVisible();
    await expect(answer).toContainText("From the site's pages, no AI");
    await expect(page.getByRole("status")).toHaveText("Answer ready.");
    const links = answer.getByRole("link");
    expect(await links.count()).toBeGreaterThanOrEqual(1);
    await expect(answer.getByRole("link", { name: /obsidian-rag/ })).toHaveAttribute("href", "/en-us/projects/obsidian-rag");
    await expect(dialog.getByRole("textbox", { name: "Ask about Victor" })).toBeFocused();

    await answer.getByRole("link", { name: /obsidian-rag/ }).click();
    await expect(page).toHaveURL(/\/en-us\/projects\/obsidian-rag$/);
    await expect(dialog).toBeHidden();
  });

  test("a question the site does not answer gets no answer, and a way to search", async ({ page }) => {
    await page.goto("/pt-br");
    await page.getByRole("button", { name: "Perguntar sobre o Victor" }).click();
    const dialog = page.getByRole("dialog");
    const input = dialog.getByRole("textbox", { name: "Pergunte sobre o Victor" });
    await input.fill("Qual é a capital da França?");
    await input.press("Enter");
    await expect(dialog.getByTestId("ask-no-source")).toContainText("Isso não está no site");
    await expect(page.getByRole("status")).toHaveText("Nada no site responde a isso.");
    await expect(dialog.getByRole("link", { name: "Sobre e contato" })).toHaveAttribute("href", "/pt-br/about");
    await dialog.getByRole("button", { name: "Buscar no site" }).click();
    await expect(dialog.getByRole("tab", { name: "Buscar" })).toHaveAttribute("aria-selected", "true");
    await expect(dialog.getByPlaceholder(/Buscar experiências/)).toHaveValue("Qual é a capital da França?");
  });

  test("Escape closes the panel and returns focus to the button", async ({ page }) => {
    await page.goto("/en-us");
    await openAsk(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: "Ask about Victor" })).toBeFocused();
  });

  test("the API refuses invalid and cross-site requests", async ({ request }) => {
    const tooLong = await request.post("/api/ask", { data: { locale: "en-us", question: "a".repeat(301) } });
    expect(tooLong.status()).toBe(400);
    const crossSite = await request.post("/api/ask", {
      data: { locale: "en-us", question: "Does he use Nix?" },
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(crossSite.status()).toBe(403);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`the open panel has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us");
      const dialog = await openAsk(page);
      await dialog.getByRole("button", { name: "How does Victor use Nix?" }).click();
      await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

test.describe("profile chat on a 360px phone", () => {
  test.skip(({ isMobile }) => isMobile, "sets its own viewport; runs once, in the desktop project");

  test("fills the screen, has no horizontal scroll and keeps 44px targets", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    await page.goto("/en-us");
    const dialog = await openAsk(page);
    // Measured once the opening zoom has settled.
    await expect.poll(() => dialog.boundingBox()).toEqual({ x: 0, y: 0, width: 360, height: 740 });
    await dialog.getByRole("button", { name: "What security experience does Victor have?" }).click();
    await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
    const dialogOverflow = await dialog.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(dialogOverflow).toBeLessThanOrEqual(0);
    const small = await dialog.evaluate((el) =>
      [...el.querySelectorAll<HTMLElement>("button, input, a[href]")]
        .filter((target) => target.checkVisibility() && target.closest("sup") === null)
        .map((target) => ({
          name: target.getAttribute("aria-label") ?? target.textContent.trim(),
          height: target.getBoundingClientRect().height,
        }))
        .filter((target) => target.height < 44)
        .map((target) => `${target.name}: ${String(Math.round(target.height))}`)
    );
    expect(small).toEqual([]);
    await context.close();
  });
});
