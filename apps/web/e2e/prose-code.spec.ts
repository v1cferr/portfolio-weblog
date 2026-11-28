import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { auditThemeOnce } from "./axe-theme";

/*
 * Code blocks in posts. A plain-text block (```text) has no Shiki colour per
 * token, so its text inherits the prose colour: it must stay readable in both
 * themes, not the light grey typography meant for a dark block.
 */

const POST = "/pt-br/weblog/personal-architecture-lion-and-usb";

test.describe("post code blocks", () => {
  for (const scheme of ["light", "dark"] as const) {
    test(`a plain-text block passes colour contrast (${scheme})`, async ({ page }) => {
      auditThemeOnce(scheme);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(POST);
      const block = page.locator('.prose-hub pre[data-language="text"]').first();
      await expect(block).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include('.prose-hub pre[data-language="text"]')
        .withRules(["color-contrast"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
