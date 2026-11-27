import AxeBuilder from "@axe-core/playwright";
import { type Browser, expect, type Locator, type Page, test } from "@playwright/test";

/**
 * The Ask dock on real phone screens (ADR 0011): a modal bottom sheet. Each
 * test runs in an emulated phone (`isMobile`, touch) at the two most common
 * small widths. What it guards is the bug that started this: the whole panel
 * scrolling inside itself, so its header slid away and empty space opened
 * below. Only the message list may scroll. CI has no model key, so answers are
 * the site's passages (extractive), which are long enough to scroll.
 */

const PHONES = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
] as const;

const QUESTIONS = ["What is my current role?", "How do I use Nix?", "Which RAG projects have I built?"];

// The contexts below set their own viewport, so one browser project is enough.
test.skip(({ isMobile }) => isMobile, "runs once, in the desktop project");

async function openPhone(browser: Browser, viewport: { width: number; height: number }, options: { reducedMotion?: "reduce" } = {}) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2, ...options });
  return { context, page: await context.newPage() };
}

async function openSheet(page: Page) {
  await page.goto("/en-us");
  await expect(page.getByTestId("ask-launcher")).toHaveAttribute("data-ready", "");
  await page.getByTestId("ask-launcher").click();
  const sheet = page.getByRole("dialog", { name: "Ask about my work" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("textbox", { name: "Ask about my work" })).toBeFocused();
  return sheet;
}

/** Types and sends a question, then waits for its (extractive) answer. */
async function ask(sheet: Locator, question: string, index: number) {
  const input = sheet.getByRole("textbox", { name: "Ask about my work" });
  await input.fill(question);
  await input.press("Enter");
  await expect(sheet.getByTestId("ask-extractive")).toHaveCount(index + 1);
}

for (const viewport of PHONES) {
  test.describe(`Ask sheet at ${String(viewport.width)}x${String(viewport.height)}`, () => {
    test("three questions scroll the list, never the sheet: the header and the input stay in view", async ({ browser }) => {
      const { context, page } = await openPhone(browser, viewport);
      const sheet = await openSheet(page);
      // Modal on phones: the page behind is hidden from assistive technology and takes no taps while the sheet is open.
      await expect(page.getByRole("banner")).toHaveCount(0);
      await expect(page.locator("body")).toHaveCSS("pointer-events", "none");
      for (const [index, question] of QUESTIONS.entries()) await ask(sheet, question, index);

      const list = sheet.getByTestId("ask-messages");
      const scroller = list.locator(":scope > div").first();
      // The list holds more than fits, and it is what scrolls.
      expect(await scroller.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0);
      // Nothing scrolled the sheet itself, or any box between it and the list.
      const scrolled = await sheet.evaluate((el: HTMLElement) => {
        const boxes = [el, ...el.querySelectorAll<HTMLElement>("*")].filter(
          // The list's own scroller (the chat container's child) is the one box allowed to scroll.
          (box) => box.parentElement?.dataset.slot !== "chat-container"
        );
        return boxes.filter((box) => box.scrollTop !== 0).map((box) => (box.getAttribute("class") ?? box.tagName).slice(0, 60));
      });
      expect(scrolled).toEqual([]);

      const header = sheet.getByRole("heading", { name: "Ask about my work" });
      const input = sheet.getByRole("textbox", { name: "Ask about my work" });
      const headerBox = await header.boundingBox();
      const inputBox = await input.boundingBox();
      expect(headerBox?.y ?? -1).toBeGreaterThanOrEqual(0);
      expect((inputBox?.y ?? 0) + (inputBox?.height ?? Infinity)).toBeLessThanOrEqual(viewport.height);
      // The sheet reaches the bottom and stops short of the top (notch room), with no empty band under it.
      const box = await sheet.boundingBox();
      expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(viewport.height);
      expect(box?.y ?? 0).toBeGreaterThan(0);

      // No horizontal scrolling, in the page or the sheet.
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      expect(await sheet.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
      await context.close();
    });

    test("every target in the sheet is at least 44px tall", async ({ browser }) => {
      const { context, page } = await openPhone(browser, viewport);
      const sheet = await openSheet(page);
      await ask(sheet, QUESTIONS[0] ?? "", 0);
      const small = await sheet.evaluate((el) =>
        [...el.querySelectorAll<HTMLElement>("button, textarea, a[href]")]
          // Citation numbers are inline text with an invisible hit area (a ::before), measured below.
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
}

test.describe("Ask sheet gestures and preferences", () => {
  test("Esc closes the sheet and returns focus to the launcher", async ({ browser }) => {
    const { context, page } = await openPhone(browser, PHONES[0]);
    const sheet = await openSheet(page);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.getByTestId("ask-launcher")).toBeFocused();
    await expect(page.getByTestId("ask-launcher")).toHaveAttribute("aria-expanded", "false");
    await context.close();
  });

  test("dragging the sheet down closes it, and the conversation is kept", async ({ browser }) => {
    const { context, page } = await openPhone(browser, PHONES[1]);
    const sheet = await openSheet(page);
    await ask(sheet, QUESTIONS[1] ?? "", 0);
    // Let the opening slide settle before grabbing the handle.
    await expect.poll(async () => (await sheet.boundingBox())?.y).toBe(12);
    const header = await sheet.getByRole("heading", { name: "Ask about my work" }).boundingBox();
    const x = (header?.x ?? 0) + 20;
    const y = (header?.y ?? 0) - 10;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 10; step++) await page.mouse.move(x, y + step * 60);
    await page.mouse.up();
    await expect(sheet).toBeHidden();
    await page.getByTestId("ask-launcher").click();
    await expect(sheet.getByTestId("ask-extractive")).toBeVisible();
    await context.close();
  });

  test("with reduced motion the sheet appears without sliding", async ({ browser }) => {
    const { context, page } = await openPhone(browser, PHONES[0], { reducedMotion: "reduce" });
    const sheet = await openSheet(page);
    const durations = await sheet.evaluate((el) => {
      const style = getComputedStyle(el);
      return [...style.transitionDuration.split(","), ...style.animationDuration.split(",")].map((value) => parseFloat(value));
    });
    for (const duration of durations) expect(duration).toBeLessThan(0.02);
    await context.close();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`the sheet with a conversation has no serious axe violations (${theme})`, async ({ browser }) => {
      const { context, page } = await openPhone(browser, PHONES[0], { reducedMotion: "reduce" });
      await page.emulateMedia({ colorScheme: theme });
      const sheet = await openSheet(page);
      await ask(sheet, QUESTIONS[2] ?? "", 0);
      const results = await new AxeBuilder({ page }).include("#ask-dock").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      await context.close();
    });
  }
});
