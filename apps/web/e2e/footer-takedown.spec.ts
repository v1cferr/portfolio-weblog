import { expect, test } from "@playwright/test";

/*
 * The footer tells owners of third-party material (official product images
 * on /setup, logos) how to ask for a takedown: by email, at the profile's
 * public address, in the page's language.
 */

test.describe("footer takedown notice", () => {
  test("shows the request in Portuguese with the contact email", async ({ page }) => {
    await page.goto("/pt-br/setup");
    const notice = page.locator("footer #takedown");
    await expect(notice).toContainText("quer que eu o remova");
    await expect(notice.getByRole("link")).toHaveAttribute("href", /^mailto:.+@.+/);
  });

  test("shows the request in English", async ({ page }) => {
    await page.goto("/en-us");
    await expect(page.locator("footer #takedown")).toContainText("you'd like it removed");
  });
});
