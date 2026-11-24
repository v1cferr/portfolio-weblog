import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const PAGES = [
  "/en-us",
  "/en-us/about",
  "/en-us/career",
  "/en-us/career/xmart-solutions-2024",
  "/en-us/career/fai-ufscar-2026",
  "/en-us/career/freelance-2024",
  "/en-us/projects",
  "/en-us/projects/obsidian-rag",
  "/en-us/timeline",
  "/en-us/education",
  "/en-us/weblog",
  "/en-us/weblog/rebuilding-the-hub-content-first",
  "/en-us/setup",
  "/en-us/wow",
  "/en-us/now",
  "/en-us/next",
  "/pt-br",
  "/pt-br/career",
  "/pt-br/now",
  "/zh-cn/projects",
];

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

test.describe("every page", () => {
  for (const path of PAGES) {
    test(`${path} renders one h1, fits the viewport and logs no errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("narrow viewport without mobile auto-zoom", () => {
  // The mobile project emulates a phone, which zooms out to fit wide content
  // and hides horizontal overflow from the check above; a plain 400px window
  // does not.
  for (const path of ["/pt-br", "/en-us"]) {
    test(`${path} has no horizontal scroll at 400px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 400, height: 800 }, isMobile: false });
      const page = await context.newPage();
      await page.goto(path, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scrolling").toBeLessThanOrEqual(0);
      await context.close();
    });
  }
});

test.describe("accessibility", () => {
  for (const path of [
    "/en-us",
    "/en-us/about",
    "/en-us/career/xmart-solutions-2024",
    "/en-us/timeline",
    "/en-us/weblog/rebuilding-the-hub-content-first",
    "/en-us/education",
    "/en-us/now",
    "/pt-br/next",
  ]) {
    for (const theme of ["light", "dark"] as const) {
      test(`${path} has no serious axe violations (${theme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(path);
        // Entrances fade in; audit the settled page, not a frame mid-fade.
        // Whatever is on screen must be fully shown; the rest waits, hidden.
        await page.waitForFunction(() =>
          [...document.querySelectorAll("[data-reveal]")].every((el) => {
            const opacity = getComputedStyle(el).opacity;
            return el.getBoundingClientRect().top < window.innerHeight * 0.85 ? opacity === "1" : ["0", "1"].includes(opacity);
          })
        );
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});

test.describe("glass tooltips", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`a tooltip keeps its text readable over the glass (${theme})`, async ({ page }) => {
      test.skip(isMobile(page), "tooltips open on hover");
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/en-us");
      await page.getByRole("main").getByRole("list", { name: "Links" }).getByRole("link").first().hover();
      const tooltip = page.locator('[data-slot="tooltip-content"]');
      await expect(tooltip).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[data-slot="tooltip-content"]').withTags(["wcag2aa"]).analyze();
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
      // axe leaves text over a backdrop filter as "incomplete", so measure it:
      // the text against the glass tint composited over the page background.
      const ratio = await tooltip.evaluate((el) => {
        const rgba = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
        const [r = 0, g = 0, b = 0, a = 1] = rgba(getComputedStyle(el).backgroundColor);
        const page = rgba(getComputedStyle(document.body).backgroundColor);
        const surface = [r, g, b].map((channel, i) => channel * a + (page[i] ?? 0) * (1 - a));
        const luminance = (rgb: number[]) => {
          const [lr = 0, lg = 0, lb = 0] = rgb.map((c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4));
          return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
        };
        const [high, low] = [luminance(surface), luminance(rgba(getComputedStyle(el).color))].sort((x, y) => y - x);
        return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
      });
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
});

test.describe("glass header", () => {
  test("blurs the page behind it: no backdrop root between the pill and the page", async ({ page }) => {
    await page.goto("/en-us");
    // A view-transition-name, filter, opacity below 1 or mask on an ancestor makes it a backdrop root, and the
    // pill's backdrop-filter would then blur only that ancestor's transparent box instead of the page.
    const roots = await page.locator("header .glass-float").evaluate((pill) => {
      const found: string[] = [];
      for (let el = pill.parentElement; el && el !== document.documentElement; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (style.viewTransitionName !== "none" || style.filter !== "none" || style.opacity !== "1" || style.maskImage !== "none") {
          found.push(el.tagName);
        }
      }
      return found;
    });
    expect(roots).toEqual([]);
  });
});

test.describe("palette", () => {
  // Graphite + sage (ADR 0007, 2026-11-23): the name is plain foreground, and no token drifts back to pink or purple.
  for (const theme of ["light", "dark"] as const) {
    test(`the hero name is the foreground and no lane is pink or purple (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/en-us");
      const name = page.getByRole("heading", { level: 1 }).locator("span").first();
      const [nameColour, bodyColour, backgroundImage] = await name.evaluate((el) => [
        getComputedStyle(el).color,
        getComputedStyle(document.body).color,
        getComputedStyle(el).backgroundImage,
      ]);
      expect(nameColour).toBe(bodyColour);
      expect(backgroundImage).toBe("none");

      const hues = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const tokens = [
          "--primary",
          "--brand",
          "--ring",
          "--destructive",
          "--lane-career",
          "--lane-project",
          "--lane-study",
          "--lane-writing",
        ];
        return tokens.map((token) => {
          const value = root.getPropertyValue(token).trim();
          const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
          const max = Math.max(r, g, b);
          const delta = max - Math.min(r, g, b);
          let hue = 0;
          if (delta > 0) {
            if (max === r) hue = 60 * (((g - b) / delta) % 6);
            else if (max === g) hue = 60 * ((b - r) / delta + 2);
            else hue = 60 * ((r - g) / delta + 4);
          }
          return { token, value, hue: (hue + 360) % 360 };
        });
      });
      // Violet, purple, magenta and pink sit between about 250° and 345°.
      expect(hues.filter(({ hue }) => hue > 250 && hue < 345)).toEqual([]);
    });
  }
});

test.describe("hero identity", () => {
  // The hero names the role, areas and daily stack only; the employer shows in the trajectory and career.
  test("shows the role and the stack, not the employer", async ({ page }) => {
    await page.goto("/pt-br");
    const hero = page.locator("main section").first();
    // The title comes from the current role in the career, without the employer.
    await expect(hero.getByText("Analista de Sistemas de IA", { exact: true })).toBeVisible();
    await expect(hero.getByText(/LLMOps · RAG\/GraphRAG/)).toBeVisible();
    await expect(hero.getByRole("list", { name: "Stack do dia a dia" }).getByRole("listitem")).toHaveText([
      "Python/FastAPI",
      "TypeScript/React",
      "Nix/NixOS",
    ]);
    await expect(hero).not.toContainText("FAI");
  });
});

test.describe("hero signatures", () => {
  // The V1C mark and the NixOS logo sit behind the hero text on opposite corners; the text column
  // shrinks as the avatar takes its share, so they must not stack at any common width.
  for (const width of [390, 768, 1024, 1171, 1440]) {
    test(`do not overlap at ${String(width)}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/en-us");
      const boxes = await page
        .locator("section svg.spotlight-reveal")
        .evaluateAll((logos) => logos.map((logo) => logo.getBoundingClientRect().toJSON() as DOMRect));
      expect(boxes).toHaveLength(2);
      const [mark, nixos] = boxes as [DOMRect, DOMRect];
      const overlapX = Math.min(mark.right, nixos.right) - Math.max(mark.left, nixos.left);
      const overlapY = Math.min(mark.bottom, nixos.bottom) - Math.max(mark.top, nixos.top);
      expect(overlapX <= 0 || overlapY <= 0).toBe(true);
    });
  }
});

test.describe("hero avatar", () => {
  // A 1-bit Atkinson dither in the theme's ink (ADR 0007, 2026-11-24): lit pixels on a dark page,
  // shadow pixels on a light one, over a photo only the lens or focus shows.
  for (const [theme, mask] of [
    ["light", "hero-dither-light.png"],
    ["dark", "hero-dither-dark.png"],
  ] as const) {
    test(`draws the ${theme} mask in the foreground ink`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/en-us");
      const dither = page.locator("[data-avatar-dither]");
      await expect(dither).toHaveAttribute("aria-hidden", "true");
      const style = await dither.evaluate((el) => {
        const css = getComputedStyle(el);
        return { mask: css.maskImage || css.getPropertyValue("-webkit-mask-image"), width: el.getBoundingClientRect().width };
      });
      expect(style.mask).toContain(mask);
      expect(style.width).toBeGreaterThan(200);
      const response = await page.request.get(`/images/${mask}`);
      expect(response.ok()).toBe(true);
      expect((await response.body()).length).toBeLessThan(10_000);
    });
  }

  test("keeps the photo's alt text and box size, and shows it whole on focus", async ({ page }) => {
    await page.goto("/en-us");
    const avatar = page.locator("[data-avatar]");
    const box = await avatar.boundingBox();
    expect(box).not.toBeNull();
    // The box keeps the photo's 580 × 780 ratio before any image arrives.
    expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(580 / 780, 2);
    const photo = avatar.getByRole("img", { name: "Victor Ferreira" });
    await avatar.focus();
    await expect(photo).toHaveCSS("opacity", "1");
    await expect(photo).toHaveCSS("mask-image", "none");
  });
});

test.describe("visibility rules", () => {
  for (const path of ["/en-us/weblog/openwrt-home-network", "/en-us/does-not-exist"]) {
    test(`${path} is not found`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    });
  }

  test("legacy v1 routes redirect to their v2 page", async ({ page }) => {
    await page.goto("/pt-br/certifications");
    await expect(page).toHaveURL(/\/pt-br\/education$/);
  });

  test("unprefixed paths redirect to the default locale", async ({ page }) => {
    // A fresh context has no NEXT_LOCALE cookie, so the default locale applies.
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/en-us\/projects$/);
  });
});

test.describe("languages", () => {
  test("an unprefixed visit always follows the system language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "pt-BR" });
    const page = await context.newPage();
    await page.goto("/en-us/projects");
    await page.goto("/");
    await expect(page).toHaveURL(/\/pt-br$/);
    expect((await context.cookies()).some((cookie) => cookie.name === "NEXT_LOCALE")).toBe(false);
    await context.close();
  });

  test("a locale without editorial content says so once, site-wide", async ({ page }) => {
    await page.goto("/zh-cn/career/xmart-solutions-2024");
    await expect(page.getByText(/not available in 中文 yet/)).toHaveCount(1);
    await page.goto("/pt-br/career");
    await expect(page.getByText(/não está disponível/)).toHaveCount(0);
  });

  test("text in another language is marked with its lang attribute", async ({ page }) => {
    await page.goto("/en-us/setup");
    await expect(page.locator("main [lang=pt-br]").first()).toBeVisible();
  });
});

test.describe("media", () => {
  test("entries without photos show the reserved space", async ({ page }) => {
    await page.goto("/en-us/career/vip-telecom-2023");
    await expect(page.getByTestId("media-placeholder")).toBeVisible();
    await expect(page.getByTestId("media-placeholder")).toContainText("Photos for this entry will be added soon.");
  });

  test("entries with photos show them lazily, with alt text, in reserved space", async ({ page }) => {
    await page.goto("/en-us/career/fai-ufscar-2026");
    await expect(page.getByTestId("media-placeholder")).toHaveCount(0);
    const images = page.getByRole("list", { name: "Photos" }).getByRole("img");
    await expect(images).toHaveCount(3);
    for (const image of await images.all()) {
      expect(await image.getAttribute("alt")).not.toBe("");
      await expect(image).toHaveAttribute("loading", "lazy");
    }
    await expect(page.getByText("Internship selection result: ranked first, score 9.93.")).toBeVisible();
  });

  test("a post's figures reserve their size and load lazily", async ({ page }) => {
    await page.goto("/en-us/weblog/from-arch-to-nixos");
    const figure = page
      .locator("main figure")
      .filter({ has: page.locator("img") })
      .first();
    const image = figure.getByRole("img");
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).toHaveAttribute("width", "1600");
    await expect(image).toHaveAttribute("height", "1200");
    expect(await image.getAttribute("alt")).toContain("Arch");
    await expect(figure.locator("figcaption")).toContainText("September 2025");
  });
});

test.describe("keyboard", () => {
  test("the first Tab reaches the skip link, which moves focus to the content", async ({ page }) => {
    await page.goto("/en-us/career");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#content$/);
    await page.keyboard.press("Tab");
    const inMain = await page.evaluate(() => document.querySelector("main")?.contains(document.activeElement) ?? false);
    expect(inMain).toBe(true);
  });

  test("search opens with / and closes with Escape", async ({ page }) => {
    await page.goto("/en-us/projects");
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    await page.keyboard.press("/");
    const input = page.getByPlaceholder(/Search experiences/);
    await expect(input).toBeFocused();
    await page.keyboard.type("nixos");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  });

  test("the mobile menu works without a mouse", async ({ page }) => {
    test.skip(!isMobile(page), "mobile only");
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Open menu" }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });
});

test.describe("interactions", () => {
  test("entrances never hide content", async ({ browser }) => {
    for (const options of [{ javaScriptEnabled: false }, { reducedMotion: "reduce" as const }]) {
      const context = await browser.newContext(options);
      const page = await context.newPage();
      await page.goto("/en-us/career");
      const card = page.locator("[data-reveal]").first();
      await expect(card).toBeVisible();
      await expect(card).toHaveCSS("opacity", "1");
      await context.close();
    }
  });

  test("primary navigation reaches the career page", async ({ page }) => {
    await page.goto("/en-us");
    if (isMobile(page)) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Career" }).click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Career" }).click();
    }
    await expect(page).toHaveURL(/\/en-us\/career$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Career");
  });

  test("a manual theme lasts for the tab, and a new visit follows the system again", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light" });
    const page = await context.newPage();
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Change theme" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    // A new tab shares localStorage but not sessionStorage: a new visit.
    const next = await context.newPage();
    await next.goto("/en-us");
    await expect(next.locator("html")).not.toHaveClass(/dark/);
    await context.close();
  });

  test("the theme toggle stays disabled until hydration, so no early press is lost", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/en-us");
    await expect(page.getByRole("button", { name: "Change theme" })).toBeDisabled();
    await context.close();
  });

  test("the theme can be switched to dark", async ({ page }) => {
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Change theme" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("the locale switcher keeps the current page", async ({ page }) => {
    await page.goto("/en-us/projects");
    await page.getByRole("button", { name: "Change language" }).click();
    await page.getByRole("menuitemradio", { name: "Português" }).click();
    await expect(page).toHaveURL(/\/pt-br\/projects$/);
  });

  test("search finds an experience by technology and opens it", async ({ page }) => {
    await page.goto("/en-us");
    await page.getByRole("button", { name: "Search" }).click();
    const input = page.getByPlaceholder(/Search experiences/);
    await input.fill("fastapi");
    const result = page.getByRole("option", { name: /Xmart Solutions/ });
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).toHaveURL(/\/en-us\/career\/xmart-solutions-2024$/);
  });

  test("project filters update the list and the URL", async ({ page }) => {
    await page.goto("/en-us/projects");
    await page.getByRole("radio", { name: "Historical" }).click();
    await expect(page).toHaveURL(/state=historical/);
    await expect(page.getByText(/^\d+ projects?$/)).toBeVisible();
    for (const badge of await page
      .locator("main ul li [data-slot=badge]")
      .filter({ hasText: /^(Active|Experimental)$/ })
      .all()) {
      await expect(badge).toBeHidden();
    }
  });
});

test.describe("page transitions", () => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`list to detail and back keeps one h1 and logs no errors (${reducedMotion} motion)`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion, viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto("/en-us/projects");
      const card = page.getByRole("region", { name: "Featured" }).getByRole("heading", { level: 3 }).first();
      const title = (await card.textContent()) ?? "";
      await card.getByRole("link").click();
      await expect(page).toHaveURL(/\/en-us\/projects\/[^/]+$/);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

      await page.getByRole("navigation", { name: "breadcrumb" }).getByRole("link", { name: "Projects" }).click();
      await expect(page).toHaveURL(/\/en-us\/projects$/);
      await expect(page.locator("h1")).toHaveCount(1);

      await page.goto("/en-us/weblog");
      await page.locator("main article h2 a").first().click();
      await expect(page).toHaveURL(/\/en-us\/weblog\/[^/]+$/);
      await expect(page.locator("h1")).toHaveCount(1);

      expect(errors).toEqual([]);
      await context.close();
    });
  }

  test("the active section's pill follows the main navigation", async ({ page }) => {
    test.skip(isMobile(page), "the main navigation is in the menu on phones");
    await page.goto("/en-us/projects");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.locator("[data-nav-pill]")).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "Projects" }).locator("[data-nav-pill]")).toHaveCount(1);
    await nav.getByRole("link", { name: "Career" }).click();
    await expect(page).toHaveURL(/\/en-us\/career$/);
    await expect(nav.getByRole("link", { name: "Career" }).locator("[data-nav-pill]")).toHaveCount(1);
    await expect(nav.locator("[data-nav-pill]")).toHaveCount(1);
  });
});

test.describe("security headers", () => {
  test("pages send the CSP and hardening headers, and no x-powered-by", async ({ request }) => {
    const response = await request.get("/en-us");
    const headers = response.headers();
    const csp = headers["content-security-policy"] ?? "";
    for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) {
      expect(csp).toContain(directive);
    }
    expect(csp).not.toContain("unsafe-eval");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["strict-transport-security"]).toContain("includeSubDomains");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});

test.describe("icons", () => {
  test("the favicon files resolve and the SVG adapts to the theme", async ({ request }) => {
    for (const path of ["/favicon.ico", "/icon.svg", "/apple-touch-icon.png"]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    expect(await (await request.get("/icon.svg")).text()).toContain("prefers-color-scheme:dark");
  });
});

test.describe("external links", () => {
  for (const path of ["/en-us", "/en-us/about", "/en-us/projects/obsidian-rag", "/en-us/setup"]) {
    test(`${path} opens every external link in a new tab, without opener or referrer`, async ({ page }) => {
      await page.goto(path);
      const links = await page
        .locator('a[href^="http"]')
        .evaluateAll((anchors) =>
          anchors
            .filter((a) => !new URL((a as HTMLAnchorElement).href).hostname.endsWith("v1cferr.dev"))
            .map((a) => ({ href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel") ?? "" }))
        );
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.target, link.href ?? "").toBe("_blank");
        expect(link.rel, link.href ?? "").toContain("noopener");
        expect(link.rel, link.href ?? "").toContain("noreferrer");
      }
    });
  }
});

test.describe("structured data", () => {
  const graph = async (page: Page, path: string) => {
    await page.goto(path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
  };

  test("the home page names the site and the person, with the handle and aliases", async ({ page }) => {
    const [home] = await graph(page, "/en-us");
    await expect(page).toHaveTitle("Victor Ferreira (v1cferr, V1C)");
    const nodes = (home?.["@graph"] ?? []) as Record<string, unknown>[];
    const website = nodes.find((node) => node["@type"] === "WebSite");
    const person = nodes.find((node) => node["@type"] === "Person");
    expect(website?.name).toBe("Victor Ferreira");
    expect(website?.alternateName).toEqual(expect.arrayContaining(["v1cferr", "V1C"]));
    expect(person?.alternateName).toEqual(expect.arrayContaining(['Victor "v1cferr" Ferreira', "v1cferr", "V1C"]));
    expect((person?.sameAs as string[]).length).toBeGreaterThan(0);
  });

  test("the About page is a ProfilePage about the same person", async ({ page }) => {
    const [about] = await graph(page, "/pt-br/about");
    expect(about?.["@type"]).toBe("ProfilePage");
    expect((about?.mainEntity as Record<string, unknown>)["@id"]).toBe("https://v1cferr.dev/#person");
  });
});
