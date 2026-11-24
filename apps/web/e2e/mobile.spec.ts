import { type Browser, expect, type Locator, test } from "@playwright/test";

/**
 * Mobile first: the smallest common phone width, in a plain 360px window. The
 * Pixel 7 project emulates a phone, which zooms out to fit wide content and so
 * hides horizontal overflow; `isMobile: false` keeps the layout honest.
 */
const PHONE = { viewport: { width: 360, height: 740 }, isMobile: false } as const;

const ROUTES = [
  "/en-us",
  "/pt-br",
  "/en-us/about",
  "/en-us/career",
  "/en-us/career/xmart-solutions-2024",
  "/en-us/projects",
  "/en-us/projects/obsidian-rag",
  "/en-us/timeline",
  "/en-us/education",
  "/en-us/weblog",
  "/en-us/weblog/rebuilding-the-hub-content-first",
  "/en-us/setup",
  "/en-us/wow",
  "/en-us/now",
  "/pt-br/next",
];

/** WCAG 2.5.8 Target Size (Minimum), in CSS pixels. */
const MIN_TARGET = 24;

// The contexts below set their own viewport, so one browser project is enough.
test.skip(({ isMobile }) => isMobile, "runs once, in the desktop project");

async function openPhone(browser: Browser) {
  const context = await browser.newContext(PHONE);
  return { context, page: await context.newPage() };
}

/** Visible links and buttons inside `root`, with their rendered size; the skip link only shows on focus. */
async function targets(root: Locator) {
  return root.evaluate((element) =>
    [...element.querySelectorAll<HTMLElement>("a[href], button")]
      .filter((el) => el.getAttribute("href") !== "#content" && el.checkVisibility())
      .map((el) => {
        const box = el.getBoundingClientRect();
        const name = el.getAttribute("aria-label") ?? el.textContent.trim();
        return { name, width: Math.round(box.width), height: Math.round(box.height) };
      })
  );
}

function tooSmall(list: { name: string; width: number; height: number }[]) {
  return list
    .filter((target) => target.width < MIN_TARGET || target.height < MIN_TARGET)
    .map((t) => `${t.name}: ${String(t.width)}x${String(t.height)}`);
}

test.describe("phones at 360px", () => {
  for (const path of ROUTES) {
    test(`${path} has no horizontal overflow`, async ({ browser }) => {
      const { context, page } = await openPhone(browser);
      await page.goto(path, { waitUntil: "load" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
      await context.close();
    });
  }

  test("header controls meet the 24x24 target minimum", async ({ browser }) => {
    const { context, page } = await openPhone(browser);
    await page.goto("/en-us");
    const list = await targets(page.getByRole("banner"));
    expect(list.length).toBeGreaterThanOrEqual(5);
    expect(tooSmall(list)).toEqual([]);
    await context.close();
  });

  test("the menu's links and close button meet the 24x24 target minimum", async ({ browser }) => {
    const { context, page } = await openPhone(browser);
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Career" })).toBeVisible();
    const list = await targets(dialog);
    expect(list.length).toBeGreaterThanOrEqual(8);
    expect(tooSmall(list)).toEqual([]);
    await context.close();
  });

  test("the header still fits with the now-playing chip", async ({ browser }) => {
    const { context, page } = await openPhone(browser);
    await page.route("**/api/now-playing", (route) =>
      route.fulfill({
        json: {
          state: "playing",
          title: "505",
          artists: ["Arctic Monkeys"],
          trackUrl: "https://open.spotify.com/track/58ge6dfP91o9oXMzq3XkIS",
          durationMs: 253_000,
          progressMs: 134_000,
          fetchedAt: new Date().toISOString(),
        },
      })
    );
    await page.goto("/en-us");
    await expect(page.getByRole("banner").getByRole("button", { name: /Listening now: 505/ })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
    // Every control stays inside the glass pill.
    const spill = await page
      .getByRole("banner")
      .locator(".glass-float")
      .evaluate((pill) => {
        const bounds = pill.getBoundingClientRect();
        return [...pill.querySelectorAll("a[href], button")]
          .map((el) => el.getBoundingClientRect())
          .filter((box) => box.width > 0 && (box.left < bounds.left || box.right > bounds.right)).length;
      });
    expect(spill).toBe(0);
    expect(tooSmall(await targets(page.getByRole("banner")))).toEqual([]);
    await context.close();
  });
});
