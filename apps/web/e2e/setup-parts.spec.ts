import { readFileSync } from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";

/*
 * Part photos on /setup (content/profile/setup.yaml, `media` on an item): a
 * square thumbnail on the card opens the lightbox with a ?photo= deep link; a
 * part without one shows just its card, with no placeholder. Until the owner
 * adds photos, only the empty case can be checked on the real content.
 */

interface Item {
  id: string;
  media?: { surface?: string };
}
const setup = parse(readFileSync(path.join(import.meta.dirname, "../../../content/profile/setup.yaml"), "utf8")) as {
  groups: { items: Item[] }[];
};
const withPhoto = setup.groups.flatMap((group) => group.items).filter((item) => item.media !== undefined);

test.describe("setup part photos", () => {
  test("a part without a photo shows just its card, with no placeholder", async ({ page }) => {
    await page.goto("/pt-br/setup");
    const without = setup.groups.flatMap((group) => group.items).find((item) => item.media === undefined);
    test.skip(without === undefined, "every part has a photo");
    await expect(page.locator(`#${without?.id ?? ""} [data-testid=setup-part-photo]`)).toHaveCount(0);
    await expect(page.locator("[data-testid=setup-part-photo]")).toHaveCount(withPhoto.length);
  });

  test("a thumbnail opens the lightbox with a deep link", async ({ page }) => {
    test.skip(withPhoto.length === 0, "no part has a photo yet");
    await page.goto("/pt-br/setup");
    const first = withPhoto[0]?.id ?? "";
    await page.locator(`#${first} [data-testid=setup-part-photo]`).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("photo")).toBe("setup-parts-1");
    // Once the large file paints, the thumbnail under it is gone: a cut-out would show it as a blurry halo.
    await expect(page.getByTestId("lightbox-frame").locator("img")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("a white product kept on white sits on a light tile in both themes", async ({ page }) => {
    const light = withPhoto.find((item) => item.media?.surface === "light");
    test.skip(light === undefined, "no part photo keeps a light background");
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/pt-br/setup");
      const thumbnail = page.locator(`#${light?.id ?? ""} [data-testid=setup-part-photo]`);
      await expect(thumbnail).toHaveAttribute("data-surface", "light");
      const tile = thumbnail.locator("xpath=ancestor::*[contains(@class,'bg-white')][1]");
      await expect(tile).toHaveCSS("background-color", "rgb(255, 255, 255)");
    }
  });

  test("the cards fit a 360px phone and pass axe in both themes", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/pt-br/setup");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).include("main").analyze();
      expect(results.violations).toEqual([]);
    }
  });
});
