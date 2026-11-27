import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * "Curiosities" at the end of the About page (profile.yaml `curiosities`):
 * personal facts, the tattoo photo in the lightbox, links to the pages that tell more.
 */

test.describe("about curiosities", () => {
  test("lists the facts, each with its link, in both languages", async ({ page }) => {
    await page.goto("/pt-br/about");
    const section = page.getByTestId("curiosities");
    await expect(section.getByRole("heading", { name: "Curiosidades" })).toBeVisible();
    await expect(section.getByText(/Minha única tatuagem/)).toBeVisible();
    await expect(section.locator("#curiosity-wow-on-nix").getByRole("link", { name: /Ver mais/ })).toHaveAttribute(
      "href",
      "/pt-br/wow#wow-addons"
    );

    await page.goto("/en-us/about");
    await expect(page.getByTestId("curiosities").getByRole("heading", { name: "Curiosities" })).toBeVisible();
  });

  test("the tattoo photo opens in the lightbox with a deep link", async ({ page }) => {
    await page.goto("/en-us/about");
    const section = page.getByTestId("curiosities");
    await section.getByRole("link", { name: /lion's head emblem/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(new URL(page.url()).searchParams.get("photo")).toBe("curiosities-1");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/en-us/about");
    await page.getByTestId("curiosities").scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page }).include('[data-testid="curiosities"]').analyze();
    expect(results.violations).toEqual([]);
  });
});
