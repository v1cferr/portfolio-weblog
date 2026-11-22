import { describe, expect, it } from "vitest";

import { isExternalUrl } from "../src/lib/site";

describe("isExternalUrl", () => {
  it("is true for http(s) URLs on other hosts", () => {
    expect(isExternalUrl("https://github.com/v1cferr")).toBe(true);
    expect(isExternalUrl("http://example.com")).toBe(true);
  });

  it("is false for the site, its subdomains and relative links", () => {
    expect(isExternalUrl("https://v1cferr.dev/en-us")).toBe(false);
    expect(isExternalUrl("https://legacy.v1cferr.dev")).toBe(false);
    expect(isExternalUrl("/en-us/about")).toBe(false);
    expect(isExternalUrl("#heading")).toBe(false);
    expect(isExternalUrl("mailto:someone@example.com")).toBe(false);
  });

  it("does not trust a look-alike host", () => {
    expect(isExternalUrl("https://v1cferr.dev.example.com")).toBe(true);
    expect(isExternalUrl("https://notv1cferr.dev")).toBe(true);
  });
});
