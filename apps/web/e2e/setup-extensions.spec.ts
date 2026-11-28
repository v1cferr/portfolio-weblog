import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * The VS Code extensions on /setup (content/profile/setup.yaml
 * `vscodeExtensions`): grouped, each a deep link with its Marketplace icon,
 * the later groups folded in a disclosure kept per tab, and the old /vscode
 * route pointing here.
 */

const FOLDED = "vscode-rust-lang-rust-analyzer";

test.describe("setup VS Code extensions", () => {
  test("lists the first groups, folds the rest and keeps the disclosure per tab", async ({ page }) => {
    await page.goto("/pt-br/setup");
    const section = page.locator("section[aria-labelledby=vscode-extensions]");
    await expect(section.getByRole("heading", { level: 2, name: "Extensões do VS Code" })).toBeVisible();
    await expect(section.locator("#vscode-anthropic-claude-code")).toBeVisible();
    await expect(section.locator(`#${FOLDED}`)).toBeHidden();

    await section.getByText(/Mostrar todas as \d+ extensões/).click();
    await expect(section.locator(`#${FOLDED}`)).toBeVisible();
    await page.reload();
    await expect(section.locator(`#${FOLDED}`)).toBeVisible();
  });

  test("an extension links to the Marketplace and is a deep link that opens its fold", async ({ page }) => {
    await page.goto(`/en-us/setup#${FOLDED}`);
    const item = page.locator(`#${FOLDED}`);
    await expect(item).toBeVisible();
    await expect(item).toBeInViewport();
    await expect(item.getByRole("link", { name: /rust-analyzer/ })).toHaveAttribute(
      "href",
      "https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer"
    );
  });

  test("an extension shows its Marketplace icon, decorative and sized up front", async ({ page }) => {
    await page.goto(`/en-us/setup#${FOLDED}`);
    const icon = page.locator(`#${FOLDED} img`);
    await expect(icon).toHaveAttribute("src", "/setup/vscode/rust-lang.rust-analyzer.webp");
    await expect(icon).toHaveAttribute("alt", "");
    await expect(icon).toHaveAttribute("width", "24");
    await expect(icon).toHaveAttribute("height", "24");
    await expect.poll(() => icon.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(72);
  });

  test("the old /vscode route lands on the extensions", async ({ page }) => {
    await page.goto("/pt-br/vscode");
    await expect(page).toHaveURL(/\/pt-br\/setup#vscode-extensions$/);
  });

  test("fits a 360px phone", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/pt-br/setup");
    await page.locator("section[aria-labelledby=vscode-extensions] summary").click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("has no accessibility violations, folded groups open, in both themes", async ({ page }) => {
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/en-us/setup");
      const section = page.locator("section[aria-labelledby=vscode-extensions]");
      const details = section.locator("details");
      if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open))) await section.locator("summary").click();
      const results = await new AxeBuilder({ page }).include("main").analyze();
      expect(results.violations).toEqual([]);
    }
  });
});

test.describe("wow screenshots", () => {
  test("show no section while there are none", async ({ page }) => {
    await page.goto("/pt-br/wow");
    await expect(page.locator("#wow-screenshots")).toHaveCount(0);
  });
});
