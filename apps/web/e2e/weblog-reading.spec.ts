import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { auditThemeOnce } from "./axe-theme";

/*
 * Reading a post (docs/guides/reading.md): the text on a plain surface, the
 * "On this page" list (sticky beside the text on wide screens, a disclosure on
 * phones) and the reading progress bar.
 */

const POST = "/pt-br/weblog/personal-architecture-lion-and-usb";
const SECTION = "quatro-fios-e-um-padrão";

test.describe("post reading, wide screens", () => {
  test.skip(({ isMobile }) => isMobile, "desktop layout");

  test("lists the sections beside the text and marks the current one", async ({ page }) => {
    await page.goto(POST);
    const toc = page.getByTestId("post-toc");
    await expect(toc).toBeVisible();
    await expect(toc.getByRole("link", { name: "Quatro fios e um padrão" })).toHaveAttribute("href", `#${SECTION}`);
    await expect(page.getByTestId("post-toc-mobile")).toBeHidden();

    await toc.getByRole("link", { name: "Quatro fios e um padrão" }).click();
    await expect(page).toHaveURL(new RegExp(`#${encodeURIComponent(SECTION)}$`));
    await expect(toc.locator('a[aria-current="location"]')).toHaveText("Quatro fios e um padrão");
    // The heading lands below the sticky header, not under it.
    const top = await page.locator(`[id="${SECTION}"]`).evaluate((heading) => heading.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(60);
    // The list stays in view while the text scrolls.
    await expect(toc).toBeInViewport();
  });

  test("the progress bar fills as the text is read", async ({ page }) => {
    await page.goto(POST);
    const bar = page.getByTestId("reading-progress");
    await expect(bar).toHaveAttribute("data-progress", "0.00");
    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
    await expect(bar).toHaveAttribute("data-progress", "1.00");
    // Decorative: the scroll position already says where the reader is.
    await expect(page.locator('[aria-hidden="true"]:has([data-testid="reading-progress"])')).toHaveCount(1);
  });
});

test.describe("post reading, phones", () => {
  test.skip(({ isMobile }) => !isMobile, "phone layout");

  test("the sections are a disclosure at the top of the text", async ({ page }) => {
    await page.goto(POST);
    await expect(page.getByTestId("post-toc")).toBeHidden();
    const toc = page.getByTestId("post-toc-mobile");
    const trigger = toc.getByRole("button", { name: "Nesta página" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await toc.getByRole("link", { name: "Quatro fios e um padrão" }).click();
    await expect(page).toHaveURL(new RegExp(`#${encodeURIComponent(SECTION)}$`));
    // Kept open for the tab, like every disclosure on the site.
    await page.reload();
    await expect(page.getByTestId("post-toc-mobile").getByRole("button", { name: "Nesta página" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  test("nothing overflows sideways at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(POST);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("post reading, accessibility", () => {
  for (const path of [POST, "/en-us/weblog/how-this-site-is-built"]) {
    for (const scheme of ["light", "dark"] as const) {
      test(`${path} has no violations (${scheme})`, async ({ page }) => {
        auditThemeOnce(scheme);
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page }).include("main").analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
