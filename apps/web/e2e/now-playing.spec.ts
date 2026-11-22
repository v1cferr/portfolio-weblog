import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const cover = "a".repeat(40);
// A 1x1 opaque PNG for the dithered cover and the Spotify cover.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

test.describe("now playing", () => {
  test.beforeEach(({ page }) => {
    // The player sits under the avatar, which phones do not show.
    test.skip((page.viewportSize()?.width ?? 0) < 768, "desktop only");
  });

  test("shows the track while Spotify plays, accessibly, in both themes", async ({ page }) => {
    await page.route("**/api/now-playing", (route) =>
      route.fulfill({
        json: {
          state: "playing",
          title: "505",
          artists: ["Arctic Monkeys"],
          album: "Favourite Worst Nightmare",
          trackUrl: "https://open.spotify.com/track/58ge6dfP91o9oXMzq3XkIS",
          coverId: cover,
          progressMs: 134_000,
          durationMs: 253_000,
          fetchedAt: new Date().toISOString(),
        },
      })
    );
    await page.route("**/api/now-playing/cover/**", (route) => route.fulfill({ body: png, contentType: "image/png" }));
    await page.route("https://i.scdn.co/**", (route) => route.fulfill({ body: png, contentType: "image/png" }));

    for (const theme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us");
      await expect(page.getByRole("link", { name: "505" })).toHaveAttribute("href", /open\.spotify\.com/);
      await expect(page.getByText("Playing now")).toBeVisible();
      await expect(page.getByRole("progressbar", { name: "Track progress" })).toBeVisible();
      const results = await new AxeBuilder({ page }).include("figure").withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
    }
  });

  test("keeps the whoami caption when nothing can be shown", async ({ page }) => {
    await page.goto("/en-us");
    await expect(page.getByText("victor@hub:~$ whoami")).toBeVisible();
  });
});
