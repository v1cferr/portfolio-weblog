import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * The profile chat (ADR 0011), docked in the bottom-right corner, as CI sees
 * it: no model key, so every answer is the extractive fallback. Nothing
 * external is mocked; this is the path local development, CI and an outage
 * all take.
 */

function dock(page: Page, name = "Ask about my work") {
  return page.getByRole("dialog", { name });
}

async function openDock(page: Page) {
  await page.getByTestId("ask-launcher").click();
  const dialog = dock(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("profile chat dock", () => {
  test("the launcher opens a non-modal panel, with focus in the question box and the page still usable", async ({ page, isMobile }) => {
    await page.goto("/en-us/projects");
    const launcher = page.getByTestId("ask-launcher");
    await expect(launcher).toHaveAccessibleName("Ask about my work");
    await expect(launcher).toHaveAttribute("aria-expanded", "false");
    const dialog = await openDock(page);
    await expect(launcher).toHaveAttribute("aria-expanded", "true");
    await expect(dialog).not.toHaveAttribute("aria-modal", /.*/);
    await expect(dialog.getByRole("textbox", { name: "Ask about my work" })).toBeFocused();
    await expect(dialog.getByRole("button", { name: "What is my current role?" })).toBeVisible();
    // The page behind stays clickable: no backdrop, no inert. (On phones the dock is a full-screen sheet.)
    if (!isMobile) {
      await page.getByRole("link", { name: "v1cferr.dev, home page" }).click();
      await expect(page).toHaveURL(/\/en-us$/);
      await expect(dialog).toBeVisible();
    }
  });

  test("the header's Ask button opens the dock", async ({ page }) => {
    await page.goto("/en-us");
    await page.getByRole("banner").getByRole("button", { name: "Ask about my work" }).click();
    await expect(dock(page)).toBeVisible();
    await expect(dock(page).getByRole("textbox", { name: "Ask about my work" })).toBeFocused();
  });

  test("a suggestion gets the site's passages, and a source opens without closing the dock", async ({ page, isMobile }) => {
    await page.goto("/en-us");
    const dialog = await openDock(page);
    await dialog.getByRole("button", { name: "Which RAG projects have I built?" }).click();
    const answer = dialog.getByTestId("ask-extractive");
    await expect(answer).toBeVisible();
    await expect(answer).toContainText("From the site's pages, no AI");
    await expect(page.getByTestId("ask-status")).toHaveText("Answer ready.");
    const source = answer.getByRole("link", { name: /obsidian-rag/ });
    await expect(source).toHaveAttribute("href", "/en-us/projects/obsidian-rag");
    await expect(dialog.getByRole("textbox", { name: "Ask about my work" })).toBeFocused();

    await source.click();
    await expect(page).toHaveURL(/\/en-us\/projects\/obsidian-rag$/);
    if (isMobile) {
      // The full-screen sheet steps aside so the page can be read; the conversation is still there.
      await expect(dialog).toBeHidden();
      await page.getByTestId("ask-launcher").click();
    }
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
  });

  test("a question the site does not answer gets no answer, and a way to search", async ({ page }) => {
    await page.goto("/pt-br");
    await page.getByTestId("ask-launcher").click();
    const dialog = dock(page, "Pergunte sobre o meu trabalho");
    const input = dialog.getByRole("textbox", { name: "Pergunte sobre o meu trabalho" });
    await input.fill("Qual é a capital da França?");
    await input.press("Enter");
    await expect(dialog.getByTestId("ask-no-source")).toContainText("Isso não está no site");
    await expect(page.getByTestId("ask-status")).toHaveText("Nada no site responde a isso.");
    await expect(dialog.getByRole("link", { name: "Sobre e contato" })).toHaveAttribute("href", "/pt-br/about");
    await dialog.getByRole("button", { name: "Buscar no site" }).click();
    const search = page.getByRole("dialog", { name: "Buscar no hub" });
    await expect(search).toBeVisible();
    await expect(search.getByPlaceholder(/Buscar experiências/)).toHaveValue("Qual é a capital da França?");
  });

  test("Escape minimizes the dock and returns focus to the launcher", async ({ page }) => {
    await page.goto("/en-us");
    const dialog = await openDock(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("ask-launcher")).toBeFocused();
    await expect(page.getByTestId("ask-launcher")).toHaveAttribute("aria-expanded", "false");
  });

  test("an answer that arrives while minimized marks the launcher", async ({ page }) => {
    // Hold the answer back long enough to minimize first.
    await page.route("**/api/ask", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });
    await page.goto("/en-us");
    const dialog = await openDock(page);
    await dialog.getByRole("button", { name: "How do I use Nix?" }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("ask-unread")).toBeVisible();
    await page.getByTestId("ask-launcher").click();
    await expect(page.getByTestId("ask-unread")).toBeHidden();
    await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
  });

  test("the conversation survives a navigation and a reload", async ({ page, isMobile }) => {
    await page.goto("/en-us");
    const dialog = await openDock(page);
    await dialog.getByRole("button", { name: "How do I use Nix?" }).click();
    await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
    if (!isMobile) {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" }).click();
      await expect(page).toHaveURL(/\/en-us\/projects$/);
      await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
    }
    await page.reload();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("How do I use Nix?")).toBeVisible();
    await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
    // A new conversation starts over.
    await dialog.getByRole("button", { name: "New conversation" }).click();
    await expect(dialog.getByTestId("ask-extractive")).toBeHidden();
    await expect(dialog.getByRole("button", { name: "What is my current role?" })).toBeVisible();
  });

  test("on a project page the first suggestion is about that project", async ({ page }) => {
    await page.goto("/en-us/projects/obsidian-rag");
    const title = (await page.locator("main h1").first().textContent())?.trim() ?? "";
    expect(title).not.toBe("");
    const dialog = await openDock(page);
    await expect(dialog.getByRole("listitem").first()).toHaveText(`What problem does ${title} solve?`);
  });

  test("openAsk() from the page opens the dock and sends the question", async ({ page }) => {
    await page.goto("/en-us");
    // Hydrated: a hero button can only call openAsk() from then on, too.
    await expect(page.getByTestId("ask-launcher")).toHaveAttribute("data-ready", "");
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("v1c:ask-open", { detail: { question: "How do I use Nix?" } }));
    });
    const dialog = dock(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("How do I use Nix?")).toBeVisible();
    await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Ask about my work" })).toBeFocused();
  });

  test("expand turns the panel into a drawer the page makes room for, and back", async ({ page, isMobile }) => {
    test.skip(isMobile, "the drawer is a desktop layout; phones get a full-screen sheet");
    await page.goto("/en-us");
    const dialog = await openDock(page);
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    await dialog.getByRole("button", { name: "Expand to a side panel" }).click();
    // Under the header, down to the bottom of the window.
    await expect.poll(() => dialog.boundingBox()).toEqual({ x: viewport.width - 440, y: 72, width: 440, height: viewport.height - 72 });
    await expect(page.locator("body")).toHaveCSS("padding-right", "440px");
    // The page's content ends where the drawer starts; the header keeps the full width.
    const contentRight = await page.locator("main").evaluate((el) => el.getBoundingClientRect().right);
    expect(contentRight).toBeLessThanOrEqual(viewport.width - 440);
    await expect.poll(async () => (await page.getByRole("banner").boundingBox())?.width).toBe(viewport.width);
    await dialog.getByRole("button", { name: "Shrink to the corner" }).click();
    await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(400);
    await expect(page.locator("body")).toHaveCSS("padding-right", "0px");
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
    test(`the open dock has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us");
      const dialog = await openDock(page);
      await dialog.getByRole("button", { name: "How do I use Nix?" }).click();
      await expect(dialog.getByTestId("ask-extractive")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include("#ask-dock")
        .include('[data-testid="ask-launcher"]')
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

test.describe("profile chat dock on a 360px phone", () => {
  test.skip(({ isMobile }) => isMobile, "sets its own viewport; runs once, in the desktop project");

  test("fills the screen, has no horizontal scroll and keeps 44px targets", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    await page.goto("/en-us");
    const dialog = await openDock(page);
    // Measured once the opening slide has settled.
    await expect.poll(() => dialog.boundingBox()).toEqual({ x: 0, y: 0, width: 360, height: 740 });
    await dialog.getByRole("button", { name: "What security experience do I have?" }).click();
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
    // Its own minimize button puts the sheet away.
    await dialog.getByRole("button", { name: "Minimize" }).click();
    await expect(dialog).toBeHidden();
    await context.close();
  });
});
