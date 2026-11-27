import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * "Curiosities" at the end of the About page (profile.yaml `curiosities`):
 * personal facts, tattoo photos that open their story, links to the pages that tell more.
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

  test("the tattoo photo opens its story on the tattoos page", async ({ page }) => {
    await page.goto("/en-us/about");
    await page
      .getByTestId("curiosities")
      .getByRole("link", { name: /lion's head emblem/ })
      .click();
    await expect(page).toHaveURL(/\/en-us\/tattoos#alliance-lion$/);
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/en-us/about");
    await page.getByTestId("curiosities").scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page }).include('[data-testid="curiosities"]').analyze();
    expect(results.violations).toEqual([]);
  });
});
