import { describe, expect, it, vi } from "vitest";

import { createLimiter, fetchRepoLanguages, languageShares } from "../src";

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, ...init });

describe("languageShares", () => {
  it("turns bytes into shares of the total, largest first, with one decimal", () => {
    expect(languageShares({ CSS: 250, TypeScript: 700, Shell: 50 })).toEqual([
      { name: "TypeScript", bytes: 700, percent: 70 },
      { name: "CSS", bytes: 250, percent: 25 },
      { name: "Shell", bytes: 50, percent: 5 },
    ]);
    expect(languageShares({ A: 2, B: 1 }).map((share) => share.percent)).toEqual([66.7, 33.3]);
  });

  it("gathers languages under 1% into one Other slice at the end", () => {
    const shares = languageShares({ Nix: 9_700, Lua: 200, Shell: 60, Python: 40 }, { otherName: "Outros" });
    expect(shares).toEqual([
      { name: "Nix", bytes: 9_700, percent: 97 },
      { name: "Lua", bytes: 200, percent: 2 },
      { name: "Outros", bytes: 100, percent: 1, other: true },
    ]);
  });

  it("keeps a single small language under its own name", () => {
    expect(languageShares({ Go: 995, Makefile: 5 }).map((share) => share.name)).toEqual(["Go", "Makefile"]);
  });

  it("honours a custom threshold", () => {
    const shares = languageShares({ A: 90, B: 6, C: 4 }, { threshold: 10 });
    expect(shares.map((share) => share.name)).toEqual(["A", "Other"]);
  });

  it("yields nothing for an empty repository", () => {
    expect(languageShares({})).toEqual([]);
    expect(languageShares({ Text: 0 })).toEqual([]);
  });
});

describe("fetchRepoLanguages", () => {
  it("validates the answer and keeps GitHub's Date header", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ Nix: 1000, Shell: 20 }, { headers: { date: "Wed, 25 Nov 2026 12:00:00 GMT" } }));
    const result = await fetchRepoLanguages("me/dotfiles", { fetch, token: "t", retries: 0 });
    expect(result).toEqual({ ok: true, languages: { Nix: 1000, Shell: 20 }, fetchedAt: "2026-11-25T12:00:00.000Z" });
    expect(fetch.mock.calls[0]?.[0]).toBe("https://api.github.com/repos/me/dotfiles/languages");
    expect((fetch.mock.calls[0]?.[1]?.headers as Record<string, string>).Authorization).toBe("Bearer t");
  });

  it("passes Next's cache options through", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json({}));
    await fetchRepoLanguages("me/a", { fetch, retries: 0, init: { next: { revalidate: 60, tags: ["github"] } } });
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ next: { revalidate: 60, tags: ["github"] } });
  });

  it("rejects a shape that is not bytes per language", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json({ Nix: "a lot" }));
    expect(await fetchRepoLanguages("me/a", { fetch, retries: 0 })).toMatchObject({ ok: false, error: "unexpected response shape" });
  });

  it("reports a private or deleted repository as a 404, without throwing", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json({ message: "Not Found" }, { status: 404 }));
    expect(await fetchRepoLanguages("me/secret", { fetch, retries: 0 })).toEqual({ ok: false, status: 404, error: "GitHub answered 404" });
  });

  it("names the rate limit", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({}, { status: 403, headers: { "x-ratelimit-remaining": "0" } }));
    expect(await fetchRepoLanguages("me/a", { fetch, retries: 0 })).toMatchObject({ ok: false, status: 403, error: "rate limited" });
  });

  it("turns a network failure into an error after the retries", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error("offline"));
    expect(await fetchRepoLanguages("me/a", { fetch, retries: 1 })).toEqual({ ok: false, error: "request failed: offline" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("never requests a malformed name", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    expect((await fetchRepoLanguages("../../user", { fetch })).ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("createLimiter", () => {
  it("never runs more than the limit at once, and runs everything", async () => {
    const limit = createLimiter(2);
    let active = 0;
    let peak = 0;
    const task = async (value: number) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return value;
    };
    const results = await Promise.all([1, 2, 3, 4, 5].map((value) => limit(() => task(value))));
    expect(results).toEqual([1, 2, 3, 4, 5]);
    expect(peak).toBe(2);
  });

  it("frees the slot when a task fails", async () => {
    const limit = createLimiter(1);
    await expect(limit(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(await limit(() => Promise.resolve("next"))).toBe("next");
  });
});
