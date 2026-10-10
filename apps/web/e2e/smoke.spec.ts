import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const PAGES = [
  "/en-us",
  "/en-us/about",
  "/en-us/career",
  "/en-us/career/xmart-solutions-2024",
  "/en-us/career/fai-ufscar-2026",
  "/en-us/career/freelance-2024",
  "/en-us/projects",
  "/en-us/projects/obsidian-rag",
  "/en-us/timeline",
  "/en-us/education",
  "/en-us/weblog",
  "/en-us/weblog/rebuilding-the-hub-content-first",
  "/en-us/setup",
  "/pt-br",
  "/pt-br/career",
  "/zh-cn/projects",
];

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

test.describe("every page", () => {
  for (const path of PAGES) {
    test(`${path} renders one h1, fits the viewport and logs no errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("accessibility", () => {
  for (const path of [
    "/en-us",
    "/en-us/career/xmart-solutions-2024",
    "/en-us/timeline",
    "/en-us/weblog/rebuilding-the-hub-content-first",
  ]) {
    for (const theme of ["light", "dark"] as const) {
      test(`${path} has no serious axe violations (${theme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});

test.describe("visibility rules", () => {
  for (const path of ["/en-us/weblog/openwrt-home-network", "/en-us/does-not-exist"]) {
    test(`${path} is not found`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    });
  }

  test("legacy v1 routes redirect to their v2 page", async ({ page }) => {
    await page.goto("/pt-br/certifications");
    await expect(page).toHaveURL(/\/pt-br\/education$/);
  });

  test("unprefixed paths redirect to the default locale", async ({ page }) => {
    // A fresh context has no NEXT_LOCALE cookie, so the default locale applies.
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/en-us\/projects$/);
  });
});

test.describe("languages", () => {
  test("a locale without editorial content says so once, site-wide", async ({ page }) => {
    await page.goto("/zh-cn/career/xmart-solutions-2024");
    await expect(page.getByText(/not available in 中文 yet/)).toHaveCount(1);
    await page.goto("/pt-br/career");
    await expect(page.getByText(/não está disponível/)).toHaveCount(0);
  });

  test("text in another language is marked with its lang attribute", async ({ page }) => {
    await page.goto("/en-us/setup");
    await expect(page.locator("main [lang=pt-br]").first()).toBeVisible();
  });
});

test.describe("media", () => {
  test("entries without photos show the reserved space", async ({ page }) => {
    await page.goto("/en-us/career/fai-ufscar-2026");
    await expect(page.getByTestId("media-placeholder")).toBeVisible();
    await expect(page.getByTestId("media-placeholder")).toContainText("Photos for this entry will be added soon.");
  });
});

test.describe("keyboard", () => {
  test("the first Tab reaches the skip link, which moves focus to the content", async ({ page }) => {
    await page.goto("/en-us/career");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#content$/);
    await page.keyboard.press("Tab");
    const inMain = await page.evaluate(() => document.querySelector("main")?.contains(document.activeElement) ?? false);
    expect(inMain).toBe(true);
  });

  test("search opens with / and closes with Escape", async ({ page }) => {
    await page.goto("/en-us/projects");
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    await page.keyboard.press("/");
    const input = page.getByPlaceholder(/Search experiences/);
    await expect(input).toBeFocused();
    await page.keyboard.type("nixos");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  });

  test("the mobile menu works without a mouse", async ({ page }) => {
    test.skip(!isMobile(page), "mobile only");
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Open menu" }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });
});

test.describe("interactions", () => {
  test("primary navigation reaches the career page", async ({ page }) => {
    await page.goto("/en-us");
    if (isMobile(page)) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Career" }).click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Career" }).click();
    }
    await expect(page).toHaveURL(/\/en-us\/career$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Career");
  });

  test("the theme can be switched to dark", async ({ page }) => {
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Change theme" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("the locale switcher keeps the current page", async ({ page }) => {
    await page.goto("/en-us/projects");
    await page.getByRole("button", { name: "Change language" }).click();
    await page.getByRole("menuitemradio", { name: "Português" }).click();
    await expect(page).toHaveURL(/\/pt-br\/projects$/);
  });

  test("search finds an experience by technology and opens it", async ({ page }) => {
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Search" }).click();
    const input = page.getByPlaceholder(/Search experiences/);
    await input.fill("fastapi");
    const result = page.getByRole("option", { name: /Xmart Solutions/ });
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).toHaveURL(/\/en-us\/career\/xmart-solutions-2024$/);
  });

  test("project filters update the list and the URL", async ({ page }) => {
    await page.goto("/en-us/projects");
    await page.getByRole("radio", { name: "Historical" }).click();
    await expect(page).toHaveURL(/state=historical/);
    await expect(page.getByText(/^\d+ projects?$/)).toBeVisible();
    for (const badge of await page
      .locator("main ul li [data-slot=badge]")
      .filter({ hasText: /^(Active|Experimental)$/ })
      .all()) {
      await expect(badge).toBeHidden();
    }
  });
});
