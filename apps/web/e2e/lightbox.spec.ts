import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/*
 * The image lightbox (components/lightbox): the Setup photo timeline is the
 * longest gallery, dated and captioned. The first photo is the newest.
 */

const SETUP = "/en-us/setup";

const photoLinks = (page: Page) => page.locator('section[aria-labelledby="setup-photos"] a[href^="/setup/"]');
const dialog = (page: Page) => page.getByRole("dialog");
const counter = (page: Page) => page.getByTestId("lightbox-counter");
const photoParam = (page: Page) => new URL(page.url()).searchParams.get("photo");

/** The gallery's size and its newest photo, read from the page so new photos don't break the tests. */
async function gallery(page: Page) {
  const links = photoLinks(page);
  const total = await links.count();
  const src = (await links.first().getAttribute("href")) ?? "";
  return { total, src };
}

async function openFirst(page: Page) {
  await page.goto(SETUP);
  const info = await gallery(page);
  await photoLinks(page).first().click();
  await expect(dialog(page)).toBeVisible();
  return info;
}

test.describe("lightbox", () => {
  test("a click opens the image in a named dialog with its caption, date and position", async ({ page }) => {
    const { total, src } = await openFirst(page);
    const caption = (await dialog(page).getByTestId("lightbox-caption").textContent())?.trim() ?? "";
    expect(caption.length).toBeGreaterThan(0);
    await expect(dialog(page)).toHaveAccessibleName(caption);
    await expect(counter(page)).toHaveText(`1/${String(total)}`);
    await expect(dialog(page).getByText(`Image 1 of ${String(total)}`)).toBeAttached();
    await expect(dialog(page).locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}(-\d{2})?$/);
    await expect(dialog(page).getByRole("link", { name: /Open original/ })).toHaveAttribute("href", src);
    expect(photoParam(page)).toBe("setup-1");
  });

  test("the arrow keys and buttons step through the gallery", async ({ page }) => {
    const { total } = await openFirst(page);
    const last = `${String(total)}/${String(total)}`;
    await page.keyboard.press("ArrowRight");
    await expect(counter(page)).toHaveText(`2/${String(total)}`);
    expect(photoParam(page)).toBe("setup-2");
    await page.keyboard.press("ArrowLeft");
    await expect(counter(page)).toHaveText(`1/${String(total)}`);
    await page.keyboard.press("ArrowLeft");
    await expect(counter(page)).toHaveText(last);
    await dialog(page).getByRole("button", { name: "Next image" }).click();
    await expect(counter(page)).toHaveText(`1/${String(total)}`);
    await dialog(page).getByRole("button", { name: "Previous image" }).click();
    await expect(counter(page)).toHaveText(last);
  });

  test("Esc closes it and gives focus back to the thumbnail", async ({ page }) => {
    await openFirst(page);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(photoLinks(page).first()).toBeFocused();
    expect(photoParam(page)).toBeNull();
  });

  test("the close button closes it without leaving the page", async ({ page }) => {
    await openFirst(page);
    await dialog(page).getByRole("button", { name: "Close" }).click();
    await expect(dialog(page)).toBeHidden();
    expect(new URL(page.url()).pathname).toBe(SETUP);
    expect(photoParam(page)).toBeNull();
  });

  test("the browser's Back button closes it and stays on the page", async ({ page }) => {
    await openFirst(page);
    await page.goBack();
    await expect(dialog(page)).toBeHidden();
    expect(new URL(page.url()).pathname).toBe(SETUP);
    expect(photoParam(page)).toBeNull();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a ?photo= link opens that image on load", async ({ page }) => {
    await page.goto(SETUP);
    const { total } = await gallery(page);
    await page.goto(`${SETUP}?photo=setup-3`);
    await expect(dialog(page)).toBeVisible();
    await expect(counter(page)).toHaveText(`3/${String(total)}`);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    expect(photoParam(page)).toBeNull();
  });

  test("an unknown ?photo= leaves the page alone", async ({ page }) => {
    await page.goto(`${SETUP}?photo=setup-99`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(dialog(page)).toBeHidden();
  });

  test("the thumbnail stays a link to the file, and a modified click is left to the browser", async ({ page, context, isMobile }) => {
    test.skip(isMobile, "modifier clicks need a keyboard");
    await page.goto(SETUP);
    const { src } = await gallery(page);
    const link = photoLinks(page).first();
    await expect(link).toHaveAttribute("href", src);
    const opened = context.waitForEvent("page");
    await link.click({ modifiers: ["ControlOrMeta"] });
    const tab = await opened;
    expect(new URL(tab.url()).pathname).toBe(src);
    await tab.close();
    await expect(dialog(page)).toBeHidden();
    expect(photoParam(page)).toBeNull();
  });

  test("a horizontal swipe turns the page", async ({ page, isMobile }) => {
    test.skip(isMobile, "drives the pointer with a mouse");
    const { total } = await openFirst(page);
    const frame = page.getByTestId("lightbox-frame");
    const box = await frame.boundingBox();
    if (box === null) throw new Error("no frame");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 200, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(counter(page)).toHaveText(`2/${String(total)}`);
  });

  test("a career gallery opens from its tiles too", async ({ page }) => {
    await page.goto("/en-us/career/xmart-solutions-2024");
    const tiles = page.getByRole("list", { name: "Photos" }).getByRole("link");
    await tiles.nth(1).click();
    await expect(dialog(page)).toBeVisible();
    await expect(counter(page)).toHaveText("2/5");
    expect(photoParam(page)).toBe("xmart-solutions-2024-2");
  });

  test("a figure in a post opens alone, without the gallery controls", async ({ page }) => {
    await page.goto("/en-us/weblog/from-arch-to-nixos");
    await page.locator('article figure a[href="/setup/20250930.webp"]').click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAccessibleName("September 2025: the desk in the Arch era, with Hyprland.");
    await expect(counter(page)).toHaveCount(0);
    await expect(dialog(page).getByRole("button", { name: "Next image" })).toHaveCount(0);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious axe violations while open (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await openFirst(page);
      await expect(dialog(page).locator("img[sizes='(min-width: 1024px) 80vw, 100vw']")).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("fits a 360px window with every control reachable", async ({ browser, isMobile }) => {
    test.skip(isMobile, "sets its own viewport");
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: false });
    const page = await context.newPage();
    await openFirst(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
    for (const control of [
      dialog(page).getByRole("button", { name: "Close" }),
      dialog(page).getByRole("button", { name: "Previous image" }),
      dialog(page).getByRole("button", { name: "Next image" }),
      dialog(page).getByRole("link", { name: /Open original/ }),
    ]) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      if (box === null) continue;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
      expect(box.y + box.height).toBeLessThanOrEqual(740);
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    }
    await context.close();
  });

  test("with reduced motion the image fades in without moving", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(SETUP);
    await photoLinks(page).first().click();
    const transforms = await page.evaluate(async () => {
      const seen: string[] = [];
      const start = performance.now();
      while (performance.now() - start < 600) {
        const frame = document.querySelector('[data-testid="lightbox-frame"]');
        if (frame !== null) seen.push(getComputedStyle(frame).transform);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return seen;
    });
    expect(transforms.length).toBeGreaterThan(0);
    expect(transforms.filter((transform) => transform !== "none")).toEqual([]);
  });
});

test.describe("lightbox documents", () => {
  // A certificate is marked `document` in content: its full view is the file itself, not a re-encoded copy.
  test("serves a document's own file in the full view", async ({ page }) => {
    await page.goto("/en-us/education");
    await page.locator('a[href="/education/transforme-se/certificate.webp"]').first().click();
    const full = page.getByRole("dialog").locator("img:not([aria-hidden])");
    await expect(full).toHaveAttribute("src", "/education/transforme-se/certificate.webp");
  });

  test("asks the optimizer for a photo's full view", async ({ page }) => {
    await page.goto("/en-us/education");
    await page.locator('a[href="/education/transforme-se/class.webp"]').first().click();
    const full = page.getByRole("dialog").locator("img:not([aria-hidden])");
    await expect(full).toHaveAttribute("src", /\/_next\/image\?url=%2Feducation%2Ftransforme-se%2Fclass\.webp.*q=85/);
  });
});
