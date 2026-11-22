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
      const chip = page.getByRole("banner").getByRole("link", { name: /Listening to 505 by Arctic Monkeys/ });
      await expect(chip).toHaveAttribute("href", /open\.spotify\.com/);
      // Spotify attribution: its icon sits in the chip.
      await expect(chip.locator("svg").first()).toBeVisible();
      // Compact: icon and equalizer only, the track is in the accessible name.
      await expect(chip).toHaveText("");
      expect((await chip.boundingBox())?.height).toBe(32);
      if ((page.viewportSize()?.width ?? 0) >= 768) {
        await chip.hover();
        const card = page.locator('[data-slot="hover-card-content"]');
        await expect(card.getByText("505", { exact: true })).toBeVisible();
        await expect(card.getByText("Arctic Monkeys · Favourite Worst Nightmare")).toBeVisible();
        await expect(page.getByRole("progressbar", { name: "Track progress" })).toBeVisible();
        await expect(page.locator('img[src^="https://i.scdn.co/image/"]')).toBeVisible();
      }
      const results = await new AxeBuilder({ page }).include("header").withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
    }
  });

  test("hides the chip when nothing is playing", async ({ page }) => {
    await mock(page, { state: "recent", playedAt: new Date().toISOString(), ...track });
    await page.goto("/en-us");
    await expect(page.getByRole("banner").getByRole("link", { name: /Listening to/ })).toHaveCount(0);
  });

  test("leaves the hero to the avatar and its caption", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, "the avatar is desktop only");
    await page.goto("/en-us");
    await expect(page.getByText("victor@hub:~$ whoami")).toBeVisible();
  });
});
