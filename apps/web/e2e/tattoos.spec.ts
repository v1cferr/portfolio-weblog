import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { TATTOOS_VISIBLE } from "./review-content";

/*
 * /tattoos ("Personal architecture", content/profile/tattoos.yaml) and its
 * companion post. In review they render only on previews (ADR 0019): a plain
 * build must not show them anywhere; a CONTENT_PREVIEW=1 build checks the page.
 */

const POST = "personal-architecture-lion-and-usb";

test.describe("tattoos page, hidden until published", () => {
  test.skip(TATTOOS_VISIBLE, "the build under test shows the page");

  test("the page and its post are not found, and nothing links to them", async ({ page, request }) => {
    expect((await page.goto("/pt-br/tattoos"))?.status()).toBe(404);
    expect((await page.goto(`/pt-br/weblog/${POST}`))?.status()).toBe(404);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/tattoos");
    expect(sitemap).not.toContain(POST);
    const search = JSON.stringify(await (await request.get("/api/search/pt-br")).json());
    expect(search).not.toContain("tattoos");

    await page.goto("/pt-br/about");
    await expect(page.locator('a[href*="/tattoos"]')).toHaveCount(0);
    await expect(page.locator("#curiosity-usb-tattoo")).toHaveCount(0);
    // The lion's curiosity stays, without a link to the hidden page.
    await expect(page.locator("#curiosity-alliance-tattoo")).toHaveCount(1);
  });
});

test.describe("tattoos page", () => {
  test.skip(!TATTOOS_VISIBLE, "in review: only a CONTENT_PREVIEW=1 build shows it");

  test("shows the manifesto, the tattoos newest first and the golden ratio as an idea", async ({ page }) => {
    await page.goto("/pt-br/tattoos");
    await expect(page.getByRole("heading", { level: 1, name: "Arquitetura pessoal" })).toBeVisible();
    await expect(page.locator("#manifesto")).toContainText("O leão me lembra de tudo que atravessei.");
    const done = page.locator('section[aria-labelledby="on-my-skin"] [data-tattoo]');
    await expect(done).toHaveCount(2);
    expect(await done.evaluateAll((cards) => cards.map((card) => card.id))).toEqual(["usb-trident", "alliance-lion"]);
    await expect(page.locator("#usb-trident")).toContainText("Pulso direito");
    await expect(page.locator("#usb-trident")).toContainText("por volta do início de 2024");
    await expect(page.locator("#alliance-lion")).toContainText("Antebraço esquerdo, parte interna");
    await expect(page.locator("#alliance-lion")).toContainText("por volta do fim de 2023");

    const idea = page.locator('section[aria-labelledby="ideas"] #golden-ratio');
    await expect(idea).toHaveAttribute("data-state", "idea");
    await expect(idea).toContainText("Ideia, não feita");
    await expect(idea.locator("img, time")).toHaveCount(0);
  });

  test("keeps my quotes verbatim, folded, with a translation in English", async ({ page }) => {
    await page.goto("/en-us/tattoos");
    const card = page.locator("#alliance-lion");
    await expect(card).toContainText("around late 2023");
    const quote = card.locator('blockquote[lang="pt-br"]').first();
    await expect(quote).toBeHidden();
    await card.getByRole("button", { name: /In my words/ }).click();
    await expect(quote).toContainText("Essa tatuagem representa todas as minhas lutas");
    await expect(card.locator('figcaption[lang="en-us"]').first()).toContainText("This tattoo stands for all my struggles");

    // In Portuguese the quotes need no translation.
    await page.goto("/pt-br/tattoos");
    await page
      .locator("#alliance-lion")
      .getByRole("button", { name: /Nas minhas palavras/ })
      .click();
    await expect(page.locator("#alliance-lion figcaption")).toHaveCount(0);
  });

  test("every card is a deep link, and the photo opens in the lightbox", async ({ page }) => {
    await page.goto("/pt-br/tattoos#alliance-lion");
    const card = page.locator("#alliance-lion");
    await expect(card).toBeInViewport();
    expect(await card.evaluate((element) => element.matches(":target"))).toBe(true);
    for (const id of ["usb-trident", "alliance-lion", "golden-ratio"]) {
      await expect(page.locator(`#${id}`).getByRole("button", { name: /Copiar link/ })).toHaveCount(1);
    }

    await page
      .locator("#usb-trident")
      .getByRole("link", { name: /tatuagem preta do símbolo do USB/ })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(new URL(page.url()).searchParams.get("photo")).toBe("tattoos-1");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("links to the post, which links back, and the About curiosities point at the cards", async ({ page }) => {
    await page.goto("/pt-br/tattoos");
    await page.getByRole("link", { name: /A história completa/ }).click();
    await expect(page).toHaveURL(new RegExp(`/pt-br/weblog/${POST}$`));
    await expect(page.getByTestId("review-notice")).toHaveCount(0);
    await expect(page.locator('.prose-hub a[href="/pt-br/tattoos"]').first()).toBeVisible();

    await page.goto("/pt-br/about");
    const curiosities = page.getByTestId("curiosities");
    // The photo and the "more" link both point at the card.
    await expect(curiosities.locator('a[href="/pt-br/tattoos#alliance-lion"]')).toHaveCount(2);
    await expect(curiosities.locator('a[href="/pt-br/tattoos#usb-trident"]')).toHaveCount(2);
  });

  test("is reached from the About curiosities, not the footer, and is in the sitemap", async ({ page, request }) => {
    await page.goto("/en-us/about");
    // Clicking the tattoo's photo opens its story (few readers want it, so it is not in the footer).
    await page
      .getByTestId("curiosities")
      .getByRole("link", { name: /USB symbol/ })
      .click();
    await expect(page).toHaveURL(/\/en-us\/tattoos#usb-trident$/);
    await expect(page.locator("footer").locator('a[href$="/tattoos"]')).toHaveCount(0);
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/tattoos");
  });

  test("has no accessibility violations, quotes open, in both themes", async ({ page }) => {
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/en-us/tattoos");
      for (const trigger of await page.getByRole("button", { name: /In my words/ }).all()) await trigger.click();
      const results = await new AxeBuilder({ page }).include("main").analyze();
      expect(results.violations).toEqual([]);
    }
  });
});
