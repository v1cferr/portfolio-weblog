import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Repository languages, live from GitHub. The suite never calls GitHub: the
 * build reads the snapshot in src/lib/github-fixture.ts when GITHUB_FIXTURES=1
 * (set in CI for the build and this run). There dotfiles has nine languages
 * (three under 1%), encriptador-descriptador is archived and acuttis-point is
 * private (left out of the public index).
 */
test.skip(process.env.GITHUB_FIXTURES !== "1", "needs a build made with GITHUB_FIXTURES=1");

const DOTFILES_LEGEND = ["Nix 38.7%", "QML 37%", "TypeScript 9.5%", "Python 8.4%", "Shell 4.1%", "Lua 2.1%", "Other 0.2%"];

test.describe("repository languages", () => {
  test("the project page shows GitHub's bar and a legend, largest first, small ones as Other", async ({ page }) => {
    await page.goto("/en-us/projects/dotfiles");
    const block = page.locator("#languages");
    await expect(block.getByRole("heading", { name: "Languages" })).toBeVisible();
    await expect(block.getByRole("img", { name: `Languages: ${DOTFILES_LEGEND.join(", ")}` })).toBeVisible();
    const items = block.getByRole("list", { name: "Languages" }).getByRole("listitem");
    await expect(items).toHaveText(DOTFILES_LEGEND.map((item) => item.replace(" ", "")));
    // 8px tall and rounded, one slice per legend entry.
    const bar = block.getByTestId("language-bar");
    expect((await bar.boundingBox())?.height).toBe(8);
    await expect(bar.locator("span")).toHaveCount(DOTFILES_LEGEND.length);
    // The legend makes "Main language" redundant.
    await expect(page.getByText("Main language")).toHaveCount(0);
  });

  test("the i says the numbers come live from the repository, with its link and date", async ({ page }) => {
    await page.goto("/en-us/projects/dotfiles");
    await page.locator("#languages").getByRole("button", { name: "Where the languages come from" }).click();
    const card = page.locator('[data-slot="popover-content"]');
    await expect(card).toContainText("Live from the GitHub repository");
    await expect(card).toContainText("Updated on Nov 26, 2026");
    await expect(card.getByRole("link", { name: /GitHub repository/ })).toHaveAttribute("href", "https://github.com/v1cferr/dotfiles");
  });

  test("is localized and reachable by its anchor", async ({ page }) => {
    await page.goto("/pt-br/projects/dotfiles#languages");
    const block = page.locator("#languages");
    await expect(block.getByRole("heading", { name: "Linguagens" })).toBeInViewport();
    await expect(block.getByRole("list", { name: "Linguagens" })).toContainText("Outros");
  });

  test("an archived repository says so", async ({ page }) => {
    await page.goto("/en-us/projects/encriptador-descriptador");
    await expect(page.locator("#languages").getByTestId("repo-archived")).toHaveText("Archived");
    await page.goto("/en-us/projects/dotfiles");
    await expect(page.getByTestId("repo-archived")).toHaveCount(0);
  });

  test("a private repository has no languages block and no repository link", async ({ page }) => {
    await page.goto("/en-us/projects/acuttis-point");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#languages")).toHaveCount(0);
    await expect(page.locator('a[href^="https://github.com/v1cferr/acuttis-point"]')).toHaveCount(0);
  });

  test("project cards carry a thin bar named after the top languages", async ({ page }) => {
    await page.goto("/en-us/projects");
    const card = page
      .getByTestId("project-card")
      .filter({ has: page.getByRole("link", { name: "dotfiles", exact: true }) })
      .first();
    const bar = card.getByRole("img", { name: "Languages: Nix 38.7%, QML 37%, TypeScript 9.5%" });
    await expect(bar).toBeVisible();
    expect((await bar.boundingBox())?.height).toBe(3);
    // No bar where GitHub has nothing to say.
    const priv = page.getByTestId("project-card").filter({ has: page.getByRole("link", { name: "acuttis-point", exact: true }) });
    await expect(priv.getByTestId("language-bar")).toHaveCount(0);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`the block has no serious axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us/projects/encriptador-descriptador", { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).include("#languages").withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test.describe("at 360px", () => {
    test.use({ viewport: { width: 360, height: 740 }, isMobile: false });
    test("fits without horizontal scrolling", async ({ page }) => {
      await page.goto("/en-us/projects/dotfiles");
      await expect(page.locator("#languages")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
});
