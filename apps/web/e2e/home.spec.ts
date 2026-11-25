import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/*
 * The home page's calls to action (hero buttons, question field, "Start here")
 * and its proof line. The Ask panel itself is not asserted here: the buttons
 * only dispatch the shared `v1c:ask-open` event, so the tests listen for it.
 */

/** Records every v1c:ask-open event's detail on window.__asks. */
async function listenForAsk(page: Page) {
  await page.evaluate(() => {
    const target = window as unknown as { __asks: unknown[] };
    target.__asks = [];
    window.addEventListener("v1c:ask-open", (event) => {
      target.__asks.push((event as CustomEvent<unknown>).detail);
    });
  });
}

const asks = (page: Page) => page.evaluate(() => (window as unknown as { __asks: unknown[] }).__asks);

test.describe("home hero", () => {
  test("has Ask and Contact buttons, and no CV link or availability badge while the profile sets none", async ({ page }) => {
    await page.goto("/en-us");
    const hero = page.locator("main section").first();
    await expect(hero.getByRole("button", { name: "Ask my AI" })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute("href", /^mailto:/);
    await expect(hero.getByRole("link", { name: /^CV/ })).toHaveCount(0);
    await expect(hero.locator("[data-availability]")).toHaveCount(0);
    // The social links stay, as a secondary row.
    await expect(hero.getByRole("list", { name: "Links" }).getByRole("listitem").first()).toBeVisible();
  });

  test("is localized", async ({ page }) => {
    await page.goto("/pt-br");
    const hero = page.locator("main section").first();
    await expect(hero.getByRole("button", { name: "Perguntar à minha IA" })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Contato", exact: true })).toHaveAttribute("href", /^mailto:/);
    await expect(hero.getByPlaceholder("Pergunte algo sobre mim…")).toBeVisible();
  });

  test("the Ask button opens the panel without a question", async ({ page }) => {
    await page.goto("/en-us");
    await listenForAsk(page);
    await page.locator("main section").first().getByRole("button", { name: "Ask my AI" }).click();
    expect(await asks(page)).toEqual([{}]);
  });

  test("the question field sends its question to the panel", async ({ page }) => {
    await page.goto("/en-us");
    await listenForAsk(page);
    const field = page.getByRole("textbox", { name: "Ask a question about Victor" });
    await field.fill("What is Victor working on?");
    await field.press("Enter");
    expect(await asks(page)).toEqual([{ question: "What is Victor working on?" }]);
    await expect(field).toHaveValue("");
  });
});

test.describe("start here", () => {
  test("each card leads to its pages", async ({ page }) => {
    await page.goto("/en-us");
    const section = page.locator('section[aria-labelledby="start-here"]');
    await expect(section.getByRole("heading", { level: 2, name: "Start here" })).toBeVisible();

    const hiring = section.locator('[data-card="hiring"]');
    await expect(hiring.getByRole("heading", { name: "Hiring?" })).toBeVisible();
    await expect(hiring.getByRole("link", { name: "About me" })).toHaveAttribute("href", "/en-us/about");
    await expect(hiring.getByRole("link", { name: "Career" })).toHaveAttribute("href", "/en-us/career");
    await expect(hiring.getByRole("link", { name: "Contact" })).toHaveAttribute("href", /^mailto:/);
    await expect(hiring.getByRole("link", { name: "CV" })).toHaveCount(0);

    const work = section.locator('[data-card="work"]');
    await expect(work.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/en-us/projects");
    await expect(work.getByRole("link", { name: "Decisions" })).toHaveAttribute("href", "/en-us/decisions");
    await expect(work.getByRole("link", { name: "How this site is built" })).toHaveAttribute(
      "href",
      "/en-us/weblog/how-this-site-is-built"
    );

    const ai = section.locator('[data-card="ai"]');
    await listenForAsk(page);
    await ai.getByRole("button", { name: "Open the chat" }).click();
    // The docked panel opens (a full-screen sheet on phones); put it away before using the card again.
    await expect(page.getByRole("dialog", { name: "Ask about Victor" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Ask about Victor" })).toBeHidden();
    const samples = ai.getByRole("button").filter({ hasNotText: "Open the chat" });
    await expect(samples).toHaveCount(2);
    const question = (await samples.first().textContent())?.trim();
    await samples.first().click();
    expect(await asks(page)).toEqual([{}, { question }]);
  });
});

test.describe("proof line", () => {
  test("links each logo to its job page", async ({ page }) => {
    await page.goto("/en-us");
    const logos = page.getByRole("list", { name: "Where I've worked" }).getByRole("link");
    expect(await logos.count()).toBeGreaterThanOrEqual(1);
    for (const logo of await logos.all()) {
      await expect(logo).toHaveAttribute("href", /^\/en-us\/career\/[a-z0-9-]+$/);
      await expect(logo).toHaveAccessibleName(/\S/);
    }
  });

  test("its facts match the content", async ({ page }) => {
    await page.goto("/en-us");
    const facts = page.getByRole("list", { name: "Facts from this site's content" });
    await expect(facts.locator('[data-fact="since"]')).toHaveText(/^working since \d{4}$/);

    // The decision count matches the decisions page's list.
    const projects = Number((await facts.locator('[data-fact="projects"]').textContent())?.match(/\d+/)?.[0]);
    const decisions = Number((await facts.locator('[data-fact="decisions"]').textContent())?.match(/\d+/)?.[0]);
    await page.goto("/en-us/decisions");
    const records = await page
      .locator('main a[href^="/en-us/decisions/"]')
      .evaluateAll((links) => new Set(links.map((link) => link.getAttribute("href")).filter((href) => /\/\d{4}$/.test(href ?? ""))).size);
    expect(records).toBe(decisions);
    expect(projects).toBeGreaterThan(0);

    await page.goto("/en-us");
    await expect(facts.getByRole("link", { name: "How this site was made" })).toHaveAttribute(
      "href",
      "/en-us/weblog/how-this-site-is-built"
    );
  });
});

test.describe("home layout", () => {
  test("keeps the section order", async ({ page }) => {
    await page.goto("/en-us");
    const order = await page
      .locator("main section")
      .evaluateAll((sections) => sections.map((s) => s.getAttribute("aria-labelledby") ?? s.getAttribute("aria-label")));
    // Hero first (no label), then the paths, the proof line and the rest.
    const expected = ["start-here", "At a glance", "featured", "now", "studying", "credentials", "latest", "recent"];
    expect(order.slice(1).filter((id) => expected.includes(id ?? ""))).toEqual(expected);
    expect(order).not.toContain("trajectory");
    expect(order).not.toContain("focus");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no serious accessibility violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us", { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("fits a 360 px screen without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/en-us", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("still paints the avatar early: a priority image, not lazy", async ({ page }) => {
    await page.goto("/en-us");
    const photo = page.locator("[data-avatar]").getByRole("img", { name: "Victor Ferreira" });
    // next/image's priority: a preload in the head, and an eager image.
    await expect(page.locator('head link[rel="preload"][as="image"][imagesrcset*="hero.jpg"]')).toHaveCount(1);
    await expect(photo).not.toHaveAttribute("loading", "lazy");
  });
});

test.describe("hero social links", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`show brand colours, not the muted grey (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/en-us");
      const row = page.locator("main section").first().getByRole("list", { name: "Links" });
      const colour = (name: string) =>
        row
          .getByRole("link", { name: new RegExp(`^${name}`) })
          .locator("svg")
          .evaluate((svg) => getComputedStyle(svg).color);
      const muted = await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--muted-foreground)";
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      });
      const linkedIn = await colour("LinkedIn");
      expect(linkedIn).not.toBe(muted);
      // Links without a brand colour (email) take the accent.
      expect(await colour("Email")).not.toBe(muted);
      // The footer's row stays quiet.
      const footer = page
        .getByRole("contentinfo")
        .getByRole("link", { name: /^LinkedIn/ })
        .locator("svg");
      expect(await footer.evaluate((svg) => getComputedStyle(svg).color)).toBe(muted);
    });
  }
});
