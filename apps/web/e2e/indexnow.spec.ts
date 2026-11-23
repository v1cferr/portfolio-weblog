import { readdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

/*
 * IndexNow verifies ownership by fetching https://v1cferr.dev/<key>.txt and
 * comparing its body with the key (.github/workflows/indexnow.yml,
 * docs/guides/seo.md). The file has to be served as is: no locale redirect
 * from the proxy, no HTML.
 */
const KEY_FILES = readdirSync(path.join(import.meta.dirname, "..", "public")).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));

test.describe("IndexNow key", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("exactly one key file is published", () => {
    expect(KEY_FILES).toHaveLength(1);
  });

  for (const file of KEY_FILES) {
    test(`/${file} serves the key as plain text`, async ({ request }) => {
      const response = await request.get(`/${file}`, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toMatch(/^text\/plain\b/);
      expect((await response.text()).trim()).toBe(file.replace(/\.txt$/, ""));
    });
  }
});
