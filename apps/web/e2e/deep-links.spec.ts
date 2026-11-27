import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { TATTOOS_VISIBLE } from "./review-content";

/*
 * Deep links (docs/guides/deep-links.md): shareable elements carry stable ids,
 * a URL fragment scrolls them clear of the floating header and highlights
 * them, and a "#" button copies the link.
 */

const MOUSEPAD = "mousepad-redragon-alianca";
const MOUSEPAD_NAME = "Redragon World of Warcraft Aliança 300x800x3mm Azul";

/** The floating header's bottom edge: a target must land below it. */
async function headerBottom(page: Page): Promise<number> {
  const box = await page.locator("header").first().boundingBox();
  return box === null ? 0 : box.y + box.height;
}

async function expectBelowHeader(page: Page, id: string) {
  const target = page.locator(`#${id}`);
  await expect(target).toBeInViewport();
  const bottom = await headerBottom(page);
  await expect.poll(async () => (await target.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(bottom);
}

test.describe("deep links", () => {
  test("a fragment on load scrolls the element below the header and highlights it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/pt-br/setup#${MOUSEPAD}`);
    const target = page.locator(`#${MOUSEPAD}`);
    await expect(target).toContainText(MOUSEPAD_NAME);
    await expectBelowHeader(page, MOUSEPAD);
    expect(await target.evaluate((element) => element.matches(":target"))).toBe(true);
    expect(await target.evaluate((element) => getComputedStyle(element).animationName)).toBe("anchor-glow");
  });

  test("with reduced motion the highlight is a static outline", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/pt-br/setup#${MOUSEPAD}`);
    const target = page.locator(`#${MOUSEPAD}`);
    await expectBelowHeader(page, MOUSEPAD);
    const style = await target.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { animation: computed.animationName, outline: computed.outlineStyle };
    });
    expect(style).toEqual({ animation: "none", outline: "solid" });
  });

  test("the mousepad curiosity opens /setup at the mousepad, client-side", async ({ page }) => {
    await page.goto("/pt-br/about");
    // Survives only a client-side navigation.
    await page.evaluate(() => {
      (window as { spa?: boolean }).spa = true;
    });
    const link = page.getByTestId("curiosities").locator(`a[href="/pt-br/setup#${MOUSEPAD}"]`);
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/pt-br/setup#${MOUSEPAD}$`));
    expect(await page.evaluate(() => (window as { spa?: boolean }).spa)).toBe(true);
    await expectBelowHeader(page, MOUSEPAD);
    await expect(page.locator(`#${MOUSEPAD}`)).toHaveAttribute("data-anchor-hit", "");
    await expect(page.locator(`#${MOUSEPAD}`)).toHaveCSS("opacity", "1");
  });

  test("the add-ons curiosity points at the add-ons on /wow", async ({ page }) => {
    await page.goto("/en-us/about");
    await expect(page.getByTestId("curiosities").locator('a[href="/en-us/wow#wow-addons"]')).toHaveCount(1);
  });

  test("the copy-link button copies the URL and puts the fragment in the address bar", async ({ page, context, baseURL }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/pt-br/setup");
    const item = page.locator(`#${MOUSEPAD}`);
    await item.scrollIntoViewIfNeeded();
    await item.hover();
    const button = page.getByRole("button", { name: `Copiar link para ${MOUSEPAD_NAME}` });
    await expect(button).toBeVisible();
    await button.click();
    const expected = `${baseURL ?? ""}/pt-br/setup#${MOUSEPAD}`;
    await expect(page).toHaveURL(expected);
    await expect(page.getByRole("tooltip")).toContainText("Link copiado");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    await expect(item).toHaveAttribute("data-anchor-hit", "");
  });

  test("section headings have a copy-link button named after them", async ({ page }) => {
    await page.goto("/en-us/setup");
    await expect(page.getByRole("button", { name: "Copy link to Periféricos" })).toHaveCount(1);
  });

  test("at 360px the target fits and the page does not scroll sideways", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`/pt-br/setup#${MOUSEPAD}`);
    await expectBelowHeader(page, MOUSEPAD);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const button = page.locator(`[data-copy-link="${MOUSEPAD}"]`);
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`a highlighted target and its copy button pass axe (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(`/pt-br/setup#${MOUSEPAD}`);
      await page.locator(`[data-copy-link="${MOUSEPAD}"]`).focus();
      const results = await new AxeBuilder({ page }).include("main").analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

/** No id repeats on the page, and every linkable element has a copy-link button for its own id. */
async function expectSoundAnchors(page: Page) {
  const report = await page.evaluate(() => {
    const seen = new Map<string, number>();
    for (const element of document.querySelectorAll("[id]")) seen.set(element.id, (seen.get(element.id) ?? 0) + 1);
    const buttons = new Set([...document.querySelectorAll("[data-copy-link]")].map((button) => button.getAttribute("data-copy-link")));
    return {
      duplicates: [...seen].filter(([, count]) => count > 1).map(([id]) => id),
      withoutButton: [...document.querySelectorAll("[data-anchor]")].map((element) => element.id).filter((id) => !buttons.has(id)),
    };
  });
  expect(report).toEqual({ duplicates: [], withoutButton: [] });
}

/** The first detail page linked from a list page, e.g. the first /career/<id>. */
async function firstDetail(page: Page, list: string, pattern: RegExp): Promise<string> {
  await page.goto(list);
  const hrefs = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  const href = hrefs.find((candidate) => pattern.test(candidate));
  if (href === undefined) throw new Error(`no link matching ${String(pattern)} on ${list}`);
  return href;
}

test.describe("anchor ids", () => {
  const pages = [
    "/pt-br",
    "/pt-br/about",
    "/pt-br/setup",
    "/pt-br/career",
    "/pt-br/education",
    "/pt-br/projects",
    "/pt-br/timeline",
    "/pt-br/decisions",
    "/pt-br/now",
    "/pt-br/wow",
    "/pt-br/weblog",
    "/pt-br/next",
    ...(TATTOOS_VISIBLE ? ["/pt-br/tattoos"] : []),
  ];

  for (const path of pages) {
    test(`ids are unique on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectSoundAnchors(page);
    });
  }

  for (const [list, pattern] of [
    ["/pt-br/career", /^\/pt-br\/career\/[\w-]+$/],
    ["/pt-br/projects", /^\/pt-br\/projects\/[\w-]+$/],
    ["/pt-br/decisions", /^\/pt-br\/decisions\/\d+$/],
    ["/pt-br/weblog", /^\/pt-br\/weblog\/[\w-]+$/],
  ] as const) {
    test(`ids are unique on a detail page of ${list}`, async ({ page }) => {
      const detail = await firstDetail(page, list, pattern);
      await page.goto(detail);
      await expectSoundAnchors(page);
    });
  }
});

test.describe("deep links across pages", () => {
  test("a post heading is linkable and named in its copy button", async ({ page }) => {
    const post = await firstDetail(page, "/pt-br/weblog", /^\/pt-br\/weblog\/[\w-]+$/);
    await page.goto(post);
    const heading = page.locator(".prose-hub h2[data-anchor]").first();
    const id = await heading.getAttribute("id");
    expect(id).not.toBeNull();
    const text = (await heading.textContent()) ?? "";
    await expect(page.getByRole("button", { name: `Copiar link para ${text.trim()}` })).toHaveCount(1);
    await page.goto(`${post}#${id ?? ""}`);
    await expectBelowHeader(page, id ?? "");
  });

  test("a timeline entry is linkable", async ({ page }) => {
    await page.goto("/pt-br/timeline");
    const entry = page.locator("main li[data-anchor]").nth(3);
    const id = (await entry.getAttribute("id")) ?? "";
    expect(id).toMatch(/^(position|project|education|certification|post|volunteering|career-break)-/);
    await page.goto(`/pt-br/timeline#${id}`);
    await expectBelowHeader(page, id);
    await expect(page.locator(`#${id}`)).toHaveCSS("opacity", "1");
  });

  test("a decision is linkable from the decision log", async ({ page }) => {
    await page.goto("/pt-br/decisions#adr-0001");
    await expectBelowHeader(page, "adr-0001");
  });

  test("a recommendation is linkable on About", async ({ page }) => {
    await page.goto("/pt-br/about#recommendation-julio-cesar-raveli");
    await expectBelowHeader(page, "recommendation-julio-cesar-raveli");
    await expect(page.getByRole("button", { name: /^Copiar link para Júlio César Raveli$/ })).toHaveCount(1);
  });
});
