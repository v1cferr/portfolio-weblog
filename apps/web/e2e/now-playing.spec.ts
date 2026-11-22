import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// A 1x1 opaque PNG for the Spotify cover.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const track = {
  title: "505",
  artists: ["Arctic Monkeys"],
  album: "Favourite Worst Nightmare",
  trackUrl: "https://open.spotify.com/track/58ge6dfP91o9oXMzq3XkIS",
  coverId: "a".repeat(40),
  durationMs: 253_000,
};

async function mock(page: Page, body: object) {
  await page.route("**/api/now-playing", (route) => route.fulfill({ json: { ...body, fetchedAt: new Date().toISOString() } }));
  await page.route("https://i.scdn.co/**", (route) => route.fulfill({ body: png, contentType: "image/png" }));
}

test.describe("now playing", () => {
  test("shows a compact header chip while Spotify plays, accessibly, in both themes", async ({ page }) => {
    await mock(page, { state: "playing", progressMs: 134_000, ...track });
    for (const theme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us");
      // A button, not a link: tapping it must not leave the site.
      const chip = page.getByRole("banner").getByRole("button", { name: /Listening now: 505 by Arctic Monkeys/ });
      await expect(chip).not.toHaveAttribute("href");
      // Spotify attribution: its icon sits in the chip.
      await expect(chip.locator("svg").first()).toBeVisible();
      // Compact: icon and equalizer only, the track is in the accessible name.
      await expect(chip).toHaveText("");
      // As tall as the header's icon buttons: 40px touch targets below lg, 32px from lg up.
      const toggle = page.getByRole("banner").getByRole("button", { name: "Change theme" });
      expect((await chip.boundingBox())?.height).toBe((await toggle.boundingBox())?.height);

      await chip.click();
      const card = page.locator('[data-slot="popover-content"]');
      await expect(card.getByText("Listening now", { exact: true })).toBeVisible();
      await expect(card.getByText("Arctic Monkeys · Favourite Worst Nightmare")).toBeVisible();
      await expect(card.getByRole("progressbar", { name: "Track progress" })).toBeVisible();
      await expect(card.locator('img[src^="https://i.scdn.co/image/"]')).toBeVisible();
      // The track itself is the link to Spotify, in a new tab; no separate "listen" link.
      const link = card.getByRole("link");
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAccessibleName(/505.*Open in Spotify/);
      await expect(link).toHaveAttribute("href", track.trackUrl);
      await expect(link).toHaveAttribute("target", "_blank");

      const results = await new AxeBuilder({ page })
        .include("header")
        .include('[data-slot="popover-content"]')
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations.map((violation) => violation.id)).toEqual([]);

      await page.keyboard.press("Escape");
      await expect(card).toBeHidden();
    }
  });

  test("opens the card on a tap without leaving the site", async ({ page }) => {
    test.skip(!test.info().project.use.hasTouch, "touch screens only");
    await mock(page, { state: "playing", progressMs: 134_000, ...track });
    await page.goto("/en-us");
    await page
      .getByRole("banner")
      .getByRole("button", { name: /Listening now/ })
      .tap();
    await expect(page.locator('[data-slot="popover-content"]').getByText("505", { exact: true })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/en-us");
    // A tap outside closes it.
    await page.locator("main").tap({ position: { x: 10, y: 300 } });
    await expect(page.locator('[data-slot="popover-content"]')).toBeHidden();
  });

  test("opens the card on hover with a mouse, and a click keeps it open", async ({ page }) => {
    test.skip(test.info().project.use.hasTouch === true, "mouse only");
    await mock(page, { state: "playing", progressMs: 134_000, ...track });
    await page.goto("/en-us");
    const chip = page.getByRole("banner").getByRole("button", { name: /Listening now/ });
    await chip.hover();
    const card = page.locator('[data-slot="popover-content"]');
    await expect(card.getByText("505", { exact: true })).toBeVisible();
    // Hovering does not move the keyboard focus into the card.
    await expect(card.getByRole("link")).not.toBeFocused();
    await chip.click();
    await expect(card).toBeVisible();
    await card.hover();
    await expect(card).toBeVisible();
  });

  test("hides the chip when nothing is playing", async ({ page }) => {
    await mock(page, { state: "recent", playedAt: new Date().toISOString(), ...track });
    await page.goto("/en-us");
    await expect(page.getByRole("banner").getByRole("button", { name: /Listening now/ })).toHaveCount(0);
  });

  test("leaves the hero to the avatar and its caption", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, "the avatar is desktop only");
    await page.goto("/en-us");
    await expect(page.getByText("victor@hub:~$ whoami")).toBeVisible();
  });
});
