import { expect, test } from "@playwright/test";

test.describe("now playing", () => {
  test("leaves the hero to the avatar and its caption", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, "the avatar is desktop only");
    await page.goto("/en-us");
    await expect(page.getByText("victor@hub:~$ whoami")).toBeVisible();
  });
});
