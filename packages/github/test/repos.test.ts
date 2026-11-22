import { describe, expect, it, vi } from "vitest";

import { fetchPublicRepos, type GitHubRepo } from "../src";

const repo = (name: string, extra: Partial<GitHubRepo> = {}) => ({
  name,
  full_name: `me/${name}`,
  private: false,
  visibility: "public",
  fork: false,
  archived: false,
  description: null,
  html_url: `https://github.com/me/${name}`,
  homepage: null,
  language: "TypeScript",
  topics: [],
  stargazers_count: 0,
  created_at: "2024-01-01T00:00:00Z",
  pushed_at: "2024-02-01T00:00:00Z",
  ...extra,
});

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, ...init });

describe("fetchPublicRepos", () => {
  it("follows Link pagination", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        json([repo("a")], { headers: { link: '<https://api.github.com/page2>; rel="next", <https://api.github.com/page2>; rel="last"' } })
      )
      .mockResolvedValueOnce(json([repo("b")]));
    const result = await fetchPublicRepos({ user: "me", fetch, retries: 0 });
    expect(result).toMatchObject({ ok: true, repos: [{ name: "a" }, { name: "b" }] });
    expect(fetch.mock.calls[1]?.[0]).toBe("https://api.github.com/page2");
  });

  it("drops private repositories even when the API returns them", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        json([repo("open"), repo("secret", { private: true, visibility: "private" }), repo("internal", { visibility: "internal" })])
      );
    const result = await fetchPublicRepos({ user: "me", fetch, token: "t", retries: 0 });
    expect(result.ok && result.repos.map((r) => r.name)).toEqual(["open"]);
  });

  it("sends the token only as a header", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json([]));
    await fetchPublicRepos({ user: "me", fetch, token: "secret-token", retries: 0 });
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBeTypeOf("string");
    expect(url as string).not.toContain("secret-token");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer secret-token");
  });

  it("retries server errors, then succeeds", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response("", { status: 502 }))
      .mockResolvedValueOnce(json([repo("a")]));
    const result = await fetchPublicRepos({ user: "me", fetch, retries: 1 });
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("reports rate limiting without retrying", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response("", { status: 403, headers: { "x-ratelimit-remaining": "0" } }));
    expect(await fetchPublicRepos({ user: "me", fetch, retries: 2 })).toEqual({ ok: false, status: 403, error: "rate limited" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns network failures instead of throwing", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error("offline"));
    expect(await fetchPublicRepos({ user: "me", fetch, retries: 1 })).toMatchObject({ ok: false, error: "request failed: offline" });
  });

  it("skips malformed entries and stops at the page limit", async () => {
    const next = { headers: { link: '<https://api.github.com/again>; rel="next"' } };
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() => Promise.resolve(json([repo("a"), { broken: true }], next)));
    expect(await fetchPublicRepos({ user: "me", fetch, maxPages: 3, retries: 0 })).toEqual({ ok: false, error: "stopped after 3 pages" });
  });
});
