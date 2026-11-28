import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/*
 * The Spotify client's rate-limit handling (2026-11-28): recently-played
 * answered 429 with Retry-After 8798 s and the site kept asking every 20 s.
 */

const NOW = new Date("2026-11-28T12:00:00Z");
const later = (ms: number) => new Date(NOW.getTime() + ms);

const recentBody = {
  items: [
    {
      played_at: "2026-11-28T11:50:00Z",
      track: {
        type: "track",
        name: "505",
        duration_ms: 253_000,
        artists: [{ name: "Arctic Monkeys" }],
        album: { name: "Favourite Worst Nightmare", images: [] },
        external_urls: { spotify: "https://open.spotify.com/track/58ge6dfP91o9oXMzq3XkIS" },
      },
    },
  ],
};

type Reply = { status: number; body?: unknown; retryAfter?: string };

/** A fake fetch: the token call always works; each API path answers from its queue (the last reply repeats). */
function fakeFetch(replies: Record<string, Reply[]>) {
  const calls: string[] = [];
  const fetch = vi.fn((input: string | URL) => {
    const url = String(input);
    if (url.includes("accounts.spotify.com")) {
      return Promise.resolve(Response.json({ access_token: "token", expires_in: 3600 }));
    }
    const path = new URL(url).pathname.replace("/v1", "");
    calls.push(path);
    const queue = replies[path] ?? [{ status: 204 }];
    const reply = queue.length > 1 ? (queue.shift() as Reply) : (queue[0] as Reply);
    const headers = reply.retryAfter === undefined ? undefined : { "retry-after": reply.retryAfter };
    return Promise.resolve(
      reply.body === undefined
        ? new Response(null, { status: reply.status, headers })
        : Response.json(reply.body, { status: reply.status, headers })
    );
  });
  vi.stubGlobal("fetch", fetch);
  return calls;
}

async function load() {
  vi.resetModules();
  return import("../src/lib/spotify");
}

beforeEach(() => {
  vi.stubEnv("SPOTIFY_CLIENT_ID", "id");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret");
  vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "refresh");
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Spotify rate limits", () => {
  it("reads Retry-After in seconds, with a minute when it is missing or unusable", async () => {
    const { retryAfterMs } = await load();
    expect(retryAfterMs("8798")).toBe(8_798_000);
    expect(retryAfterMs(null)).toBe(60_000);
    expect(retryAfterMs("soon")).toBe(60_000);
  });

  it("stops asking for the last track played until Retry-After ends", async () => {
    const calls = fakeFetch({ "/me/player/recently-played": [{ status: 429, retryAfter: "600" }] });
    const { getNowPlaying } = await load();
    expect((await getNowPlaying(NOW)).state).toBe("off");
    await getNowPlaying(later(60_000));
    await getNowPlaying(later(300_000));
    expect(calls.filter((path) => path === "/me/player/recently-played")).toHaveLength(1);
    await getNowPlaying(later(601_000));
    expect(calls.filter((path) => path === "/me/player/recently-played")).toHaveLength(2);
  });

  it("asks for the last track played at most every five minutes, and keeps showing it while blocked", async () => {
    const calls = fakeFetch({
      "/me/player/recently-played": [
        { status: 200, body: recentBody },
        { status: 429, retryAfter: "8798" },
      ],
    });
    const { getNowPlaying } = await load();
    expect((await getNowPlaying(NOW)).state).toBe("recent");
    expect((await getNowPlaying(later(60_000))).state).toBe("recent");
    expect(calls.filter((path) => path === "/me/player/recently-played")).toHaveLength(1);
    // After five minutes it asks again, is told to wait, and still shows the track it knows.
    const blocked = await getNowPlaying(later(301_000));
    expect(blocked.state).toBe("recent");
    expect(calls.filter((path) => path === "/me/player/recently-played")).toHaveLength(2);
  });

  it("keeps the CDN answer longer only while currently-playing itself is blocked, at most an hour", async () => {
    fakeFetch({
      "/me/player/currently-playing": [{ status: 429, retryAfter: "8798" }],
      "/me/player/recently-played": [{ status: 200, body: recentBody }],
    });
    const { getNowPlaying, nowPlayingMaxAge } = await load();
    expect(nowPlayingMaxAge(NOW.getTime())).toBe(20);
    await getNowPlaying(NOW);
    expect(nowPlayingMaxAge(NOW.getTime())).toBe(3600);
  });

  it("keeps the usual 20 s when only the last track played is blocked", async () => {
    fakeFetch({ "/me/player/recently-played": [{ status: 429, retryAfter: "8798" }] });
    const { getNowPlaying, nowPlayingMaxAge } = await load();
    await getNowPlaying(NOW);
    expect(nowPlayingMaxAge(NOW.getTime())).toBe(20);
  });
});
