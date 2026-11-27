import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * The profile chat while a model writes (ADR 0011): the real steps the server
 * reports, folded into one line once the answer arrives, and the notes behind
 * an "i". CI has no model key, so /api/ask is replaced in the page by a stream
 * of the real event sequence (protocol.ts). page.route can only fulfill a whole
 * body at once, so the stream is a fetch stub: it sends `reading`, then holds
 * the rest until the test releases it.
 */

const PAGES = [
  { title: "FAI·UFSCar", url: "/en-us/career/fai-ufscar-2026" },
  { title: "obsidian-rag", url: "/en-us/projects/obsidian-rag" },
];

const READING = { type: "reading", pages: PAGES };
const REST = [
  { type: "checking" },
  { type: "status", mode: "model" },
  { type: "text", text: "I'm an AI Systems Analyst at FAI·UFSCar." },
  { type: "cite", n: 1 },
  { type: "sources", sources: [{ n: 1, title: "FAI·UFSCar", url: "/en-us/career/fai-ufscar-2026" }] },
  { type: "done" },
];

type StubWindow = { __askRelease: () => void; __askReleased: Promise<void> };

/** Streams `first` (by default `reading`) after 400 ms, then waits for release() before the rest. */
async function streamAnswer(page: Page, first: object[] = [READING], rest: object[] = REST) {
  await page.addInitScript(
    ({ first, rest }) => {
      const target = window as unknown as StubWindow;
      target.__askReleased = new Promise<void>((resolve) => {
        target.__askRelease = resolve;
      });
      const original = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (!url.endsWith("/api/ask")) return original(input, init);
        const encoder = new TextEncoder();
        const line = (event: object) => encoder.encode(`${JSON.stringify(event)}\n`);
        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            for (const event of first) controller.enqueue(line(event));
            await target.__askReleased;
            for (const event of rest) controller.enqueue(line(event));
            controller.close();
          },
        });
        return Promise.resolve(new Response(body, { headers: { "Content-Type": "application/x-ndjson" } }));
      };
    },
    { first, rest }
  );
}

const release = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as StubWindow).__askRelease();
  });

function dock(page: Page) {
  return page.getByRole("dialog", { name: "Ask about my work" });
}

async function askCurrentRole(page: Page) {
  await page.goto("/en-us");
  await page.getByTestId("ask-launcher").click();
  const dialog = dock(page);
  await dialog.getByRole("button", { name: "What is my current role?" }).click();
  return dialog;
}

const animationName = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).animationName);

test.describe("profile chat streaming", () => {
  test("checked sentences show as they arrive, before the answer is complete", async ({ page }) => {
    await streamAnswer(
      page,
      [
        READING,
        { type: "checking" },
        { type: "status", mode: "model" },
        { type: "text", text: "I'm an AI Systems Analyst at FAI·UFSCar. " },
        { type: "cite", n: 1 },
      ],
      [
        { type: "text", text: "I build RAG and agents there." },
        { type: "cite", n: 1 },
        { type: "sources", sources: [{ n: 1, title: "FAI·UFSCar", url: "/en-us/career/fai-ufscar-2026" }] },
        { type: "done" },
      ]
    );
    const dialog = await askCurrentRole(page);
    const answer = dialog.getByTestId("ask-answer");
    await expect(answer).toContainText("I'm an AI Systems Analyst at FAI·UFSCar.");
    await expect(answer).toHaveAttribute("aria-busy", "true");
    await expect(answer).not.toContainText("I build RAG and agents there.");
    await release(page);
    await expect(answer).toContainText("I build RAG and agents there.");
    await expect(answer).toHaveAttribute("aria-busy", "false");
    await expect(page.getByTestId("ask-status")).toHaveText("Answer ready.");
  });
});

test.describe("profile chat steps", () => {
  test("a pending answer shows the real steps, then folds them into one line that survives a reload", async ({ page }) => {
    await streamAnswer(page);
    const dialog = await askCurrentRole(page);
    const steps = dialog.getByTestId("ask-steps");
    await expect(steps).toHaveAttribute("aria-busy", "true");
    await expect(steps).toContainText("Searched the site");
    await expect(steps).toContainText("Read 2 pages");
    await expect(steps.getByRole("link", { name: "obsidian-rag" })).toHaveAttribute("href", "/en-us/projects/obsidian-rag");
    const active = steps.getByTestId("ask-step-active");
    await expect(active).toContainText("Writing the answer…");
    // The spinner is decoration: the dock's status line already announces the wait.
    await expect(active.locator("[data-slot=spinner]")).toHaveAttribute("aria-hidden", "true");
    expect(await animationName(page, "[data-testid=ask-step-active] [data-slot=spinner]")).toBe("spin");
    expect(await animationName(page, "[data-testid=ask-step-active] [data-slot=text-shimmer]")).toBe("shimmer");
    await expect(page.getByTestId("ask-status")).toHaveText("Searching the site…");
    // The elapsed time only after 3 s.
    const elapsed = steps.getByTestId("ask-elapsed");
    await expect(elapsed).toHaveCount(0);
    await expect(elapsed).toHaveText(/^\d+ s$/, { timeout: 6000 });

    await release(page);
    const answer = dialog.getByTestId("ask-answer");
    await expect(answer).toContainText("I'm an AI Systems Analyst at FAI·UFSCar.");
    await expect(steps).toHaveCount(0);
    const toggle = answer.getByTestId("ask-summary-toggle");
    await expect(toggle).toHaveText(/^Read 2 pages · \d+ s$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    const summary = answer.getByTestId("ask-summary");
    await expect(summary).toContainText("Searched the site");
    await expect(summary).toContainText("Checked the sources");
    await expect(summary.getByRole("link", { name: "FAI·UFSCar" })).toHaveAttribute("href", "/en-us/career/fai-ufscar-2026");

    await page.reload();
    await expect(dock(page).getByTestId("ask-summary-toggle")).toHaveText(/^Read 2 pages · \d+ s$/);
  });

  test("a fast answer never flashes the steps", async ({ page }) => {
    await page.addInitScript(() => {
      new MutationObserver(() => {
        if (document.querySelector("[data-testid=ask-steps]") !== null) (window as unknown as { __flashed: boolean }).__flashed = true;
      }).observe(document, { subtree: true, childList: true });
    });
    await page.route("**/api/ask", (route) =>
      route.fulfill({
        contentType: "application/x-ndjson",
        body: [READING, ...REST].map((event) => JSON.stringify(event)).join("\n") + "\n",
      })
    );
    const dialog = await askCurrentRole(page);
    await expect(dialog.getByTestId("ask-answer")).toContainText("I'm an AI Systems Analyst");
    await expect(dialog.getByTestId("ask-summary-toggle")).toContainText("Read 2 pages");
    expect(await page.evaluate(() => (window as unknown as { __flashed?: boolean }).__flashed ?? false)).toBe(false);
  });

  test("with reduced motion nothing spins or shimmers", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await streamAnswer(page);
    const dialog = await askCurrentRole(page);
    const active = dialog.getByTestId("ask-step-active");
    await expect(active).toContainText("Writing the answer…");
    expect(await animationName(page, "[data-testid=ask-step-active] [data-slot=spinner]")).toBe("none");
    expect(await animationName(page, "[data-testid=ask-step-active] [data-slot=text-shimmer]")).toBe("none");
    // Plain, readable text: not the transparent fill the shimmer paints through.
    const color = await active.locator("[data-slot=text-shimmer]").evaluate((element) => getComputedStyle(element).color);
    expect(color).not.toBe("rgba(0, 0, 0, 0)");
    await release(page);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`steps and summary have no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await streamAnswer(page);
      const dialog = await askCurrentRole(page);
      await expect(dialog.getByTestId("ask-step-active")).toBeVisible();
      const scan = async () => {
        const results = await new AxeBuilder({ page }).include("#ask-dock").withTags(["wcag2a", "wcag2aa"]).analyze();
        return results.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      };
      expect(await scan()).toEqual([]);
      await release(page);
      await dialog.getByTestId("ask-summary-toggle").click();
      await expect(dialog.getByTestId("ask-summary")).toContainText("Checked the sources");
      expect(await scan()).toEqual([]);
    });
  }
});

test.describe("profile chat notes behind an i", () => {
  test("the header's i holds where answers come from and the privacy note, which left the panel", async ({ page }) => {
    await page.goto("/en-us");
    await page.getByTestId("ask-launcher").click();
    const dialog = dock(page);
    await expect(dialog.getByRole("button", { name: "What is my current role?" })).toBeVisible();
    await expect(dialog).not.toContainText("Don't type personal data");
    await expect(dialog).not.toContainText("Answers come only from this site's pages");
    await dialog.getByRole("button", { name: "About these answers" }).click();
    const tip = page.locator("[data-info-tip-content]");
    await expect(tip).toContainText("Answers come only from this site's pages, with links to them.");
    await expect(tip).toContainText("Claude (Anthropic) or, when it is unavailable, free models via OpenRouter");
    await expect(tip).toContainText("Don't type personal data.");
  });

  test("the AI label's i holds the disclosure, in Portuguese too", async ({ page }) => {
    await page.route("**/api/ask", (route) =>
      route.fulfill({
        contentType: "application/x-ndjson",
        body: [
          { ...READING, pages: [{ title: "FAI·UFSCar", url: "/pt-br/career/fai-ufscar-2026" }] },
          { type: "checking" },
          { type: "status", mode: "model" },
          { type: "text", text: "Sou Analista de Sistemas de IA na FAI·UFSCar." },
          { type: "cite", n: 1 },
          { type: "sources", sources: [{ n: 1, title: "FAI·UFSCar", url: "/pt-br/career/fai-ufscar-2026" }] },
          { type: "done" },
        ]
          .map((event) => JSON.stringify(event))
          .join("\n"),
      })
    );
    await page.goto("/pt-br");
    await page.getByTestId("ask-launcher").click();
    const dialog = page.getByRole("dialog", { name: "Pergunte sobre o meu trabalho" });
    await dialog.getByRole("button", { name: "Qual é o meu cargo atual?" }).click();
    const answer = dialog.getByTestId("ask-answer");
    await expect(answer.getByTestId("ask-ai-label")).toHaveText("IA, em meu nome");
    await expect(answer.getByTestId("ask-summary-toggle")).toHaveText(/^Li 1 página · \d+ s$/);
    await expect(answer).not.toContainText("Confira as fontes");
    await answer.getByRole("button", { name: "Sobre esta resposta por IA" }).click();
    await expect(page.locator("[data-info-tip-content]")).toContainText(
      "Gerado por IA a partir das páginas deste site; pode conter erros. Confira as fontes."
    );
  });

  test("the character counter shows only near the limit", async ({ page }) => {
    await page.goto("/en-us");
    await page.getByTestId("ask-launcher").click();
    const input = dock(page).getByRole("textbox", { name: "Ask about my work" });
    await input.fill("How do I use Nix?");
    await expect(dock(page).getByTestId("ask-counter")).toHaveCount(0);
    await input.fill("a".repeat(260));
    await expect(dock(page).getByTestId("ask-counter")).toHaveText("260 of 300 characters");
    await expect(input).toHaveAttribute("aria-describedby", "ask-counter");
  });
});

test.describe("profile chat dock while its code downloads", () => {
  test("a slow download shows a skeleton in the panel, then the conversation", async ({ page }) => {
    await page.goto("/en-us");
    await expect(page.getByTestId("ask-launcher")).toHaveAttribute("data-ready", "");
    // Everything the page needed has loaded: from now on only the dock's own code is held back.
    await page.route("**/_next/static/chunks/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.getByTestId("ask-launcher").click();
    const skeleton = dock(page).getByTestId("ask-skeleton");
    await expect(skeleton).toHaveAttribute("aria-busy", "true");
    await expect(skeleton.locator("[data-slot=skeleton]").first()).toBeVisible();
    await expect(dock(page).getByRole("button", { name: "What is my current role?" })).toBeVisible({ timeout: 10_000 });
    await expect(skeleton).toHaveCount(0);
  });
});

test.describe("profile chat steps on a 360px phone", () => {
  test.skip(({ isMobile }) => isMobile, "sets its own viewport; runs once, in the desktop project");

  test("pending and answered fit without horizontal scroll, with 44px targets", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    await streamAnswer(page);
    const dialog = await askCurrentRole(page);
    await expect(dialog.getByTestId("ask-step-active")).toBeVisible();
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    expect(await dialog.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    await release(page);
    await expect(dialog.getByTestId("ask-summary-toggle")).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
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
