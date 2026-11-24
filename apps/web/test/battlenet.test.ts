import { describe, expect, it, vi } from "vitest";

import {
  characterPath,
  createBattleNetClient,
  foreverSlug,
  mapPlayableNames,
  mapProfile,
  pickRender,
  profileNamespace,
  TOKEN_URL,
} from "../src/lib/battlenet";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const profile = {
  name: "Fearvy",
  level: 90,
  character_class: { name: { en_US: "Paladin", pt_BR: "Paladino", zh_CN: "圣骑士", de_DE: "Paladin" } },
  race: { name: { en_US: "Human", pt_BR: "Humano" } },
  faction: { type: "ALLIANCE", name: { en_US: "Alliance" } },
  realm: { name: { en_US: "Stormrage", pt_BR: "Tempesfúria" }, slug: "stormrage" },
  equipped_item_level: 712,
  achievement_points: 15_230,
  last_login_timestamp: Date.UTC(2026, 10, 1),
};
const media = {
  assets: [
    { key: "avatar", value: "https://render.worldofwarcraft.com/us/character/stormrage/1/2-avatar.jpg" },
    { key: "main-raw", value: "https://render.worldofwarcraft.com/us/character/stormrage/1/2-main-raw.png" },
  ],
};

/** A fake Battle.net: the token endpoint, then whatever `api` answers for each API URL. */
function fakeFetch(api: (url: URL) => Response | Promise<Response>, token = { access_token: "t1", expires_in: 86_400 }) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.toString() === TOKEN_URL) return json(token);
    return api(url);
  });
}

const urls = (mock: ReturnType<typeof fakeFetch>) =>
  mock.mock.calls.map(([input]) => (input instanceof Request ? input.url : input.toString()));

describe("battle.net client", () => {
  it("builds Retail and Forever paths and namespaces", () => {
    expect(characterPath.retail("stormrage", "Fearvy")).toBe("/profile/wow/character/stormrage/fearvy");
    expect(characterPath.forever("Judgement", "Judy")).toBe("/profile/wow/character/judgement-judy");
    expect(foreverSlug("Ëlune", "Sombra")).toBe(encodeURIComponent("ëlune-sombra"));
    expect(profileNamespace("retail", "us")).toBe("profile-us");
    expect(profileNamespace("forever", "eu")).toBe("profile-forever-eu");
  });

  it("fails soft without credentials, and never calls Battle.net", async () => {
    const fetchMock = fakeFetch(() => json(profile));
    const client = createBattleNetClient({ fetch: fetchMock });
    expect(await client.character({ game: "retail", region: "us", realmSlug: "stormrage", name: "Fearvy" })).toEqual({
      ok: false,
      reason: "no-credentials",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a Retail character with its render, through the right host and namespace", async () => {
    const fetchMock = fakeFetch((url) => (url.pathname.endsWith("/character-media") ? json(media) : json(profile)));
    const client = createBattleNetClient({ clientId: "id", clientSecret: "secret", fetch: fetchMock });
    const result = await client.character({ game: "retail", region: "us", realmSlug: "stormrage", name: "Fearvy" });
    expect(result).toEqual({
      ok: true,
      data: {
        level: 90,
        className: { "en-us": "Paladin", "pt-br": "Paladino", "zh-cn": "圣骑士" },
        raceName: { "en-us": "Human", "pt-br": "Humano" },
        faction: "alliance",
        placeName: { "en-us": "Stormrage", "pt-br": "Tempesfúria" },
        itemLevel: 712,
        achievementPoints: 15_230,
        lastLogin: "2026-11-01T00:00:00.000Z",
        renderUrl: media.assets[0]?.value,
      },
    });
    expect(urls(fetchMock)).toContain("https://us.api.blizzard.com/profile/wow/character/stormrage/fearvy?namespace=profile-us");
  });

  it("asks Forever characters by name-surname in the forever namespace", async () => {
    const fetchMock = fakeFetch((url) =>
      url.pathname.endsWith("/character-media") ? json({}, 404) : json({ level: 60, ruleset: { name: "Normal" } })
    );
    const client = createBattleNetClient({ clientId: "id", clientSecret: "secret", fetch: fetchMock });
    const result = await client.character({ game: "forever", region: "eu", name: "Judgement", surname: "Judy" });
    // No render yet (Forever renders lag by hours): still a live character.
    expect(result).toEqual({ ok: true, data: { level: 60, placeName: { "en-us": "Normal" } } });
    expect(urls(fetchMock)).toContain("https://eu.api.blizzard.com/profile/wow/character/judgement-judy?namespace=profile-forever-eu");
  });

  it("reuses the token until it is about to expire, and shares one request", async () => {
    let clock = 0;
    const fetchMock = fakeFetch(() => json(profile), { access_token: "t", expires_in: 3600 });
    const client = createBattleNetClient({ clientId: "id", clientSecret: "secret", fetch: fetchMock, now: () => clock });
    await Promise.all([client.token(), client.token(), client.token()]);
    await client.token();
    const tokenCalls = () => urls(fetchMock).filter((url) => url === TOKEN_URL).length;
    expect(tokenCalls()).toBe(1);
    clock = 3600 * 1000 - 30_000; // inside the last minute
    await client.token();
    expect(tokenCalls()).toBe(2);
  });

  it("drops the token after a 401", async () => {
    let status = 401;
    const fetchMock = fakeFetch(() => json({}, status));
    const client = createBattleNetClient({ clientId: "id", clientSecret: "secret", fetch: fetchMock });
    const ref = { game: "retail", region: "us", realmSlug: "stormrage", name: "Fearvy" } as const;
    expect(await client.character(ref)).toMatchObject({ ok: false, reason: "unauthorized" });
    status = 200;
    await client.character(ref);
    expect(urls(fetchMock).filter((url) => url === TOKEN_URL)).toHaveLength(2);
  });

  it.each([
    [403, "forbidden"],
    [404, "not-found"],
    [500, "error"],
  ])("turns %i into %s", async (status, reason) => {
    const client = createBattleNetClient({ clientId: "id", clientSecret: "s", fetch: fakeFetch(() => json({}, status)) });
    expect(await client.character({ game: "forever", region: "us", name: "A", surname: "B" })).toEqual({ ok: false, reason, status });
  });

  it("reports a rejected token request and a timeout", async () => {
    const refused = vi.fn(() => Promise.resolve(json({ error: "invalid_client" }, 401)));
    expect(await createBattleNetClient({ clientId: "id", clientSecret: "bad", fetch: refused }).token()).toMatchObject({
      ok: false,
      reason: "unauthorized",
    });

    const slow = fakeFetch(
      () =>
        new Promise<Response>((_, reject) => {
          setTimeout(() => {
            reject(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
          }, 5);
        })
    );
    const client = createBattleNetClient({ clientId: "id", clientSecret: "s", fetch: slow, timeoutMs: 1 });
    expect(await client.character({ game: "retail", region: "us", realmSlug: "x", name: "Y" })).toEqual({ ok: false, reason: "timeout" });
  });

  it("passes the cache options to API calls only", async () => {
    const fetchMock = fakeFetch(() => json(profile));
    const init = { next: { revalidate: 86_400, tags: ["wow"] } };
    await createBattleNetClient({ clientId: "id", clientSecret: "s", fetch: fetchMock, init }).character({
      game: "retail",
      region: "us",
      realmSlug: "stormrage",
      name: "Fearvy",
    });
    for (const [input, options] of fetchMock.mock.calls as unknown as [string | URL, Record<string, unknown>][]) {
      if (String(input) === TOKEN_URL) expect(options.cache).toBe("no-store");
      else expect(options.next).toEqual(init.next);
    }
  });
});

describe("battle.net mapping", () => {
  it("accepts single-locale names and ignores malformed fields", () => {
    expect(mapProfile({ level: 12, character_class: { name: "Mage" }, faction: { type: "HORDE" } })).toEqual({
      level: 12,
      className: { "en-us": "Mage" },
      faction: "horde",
    });
    expect(mapProfile({ level: "twelve" })).toEqual({});
    expect(mapProfile(null)).toEqual({});
  });

  it("only takes renders from Blizzard's render host over https", () => {
    expect(pickRender({ assets: [{ key: "avatar", value: "https://evil.example/a.jpg" }] })).toBeUndefined();
    expect(pickRender({ assets: [{ key: "avatar", value: "http://render.worldofwarcraft.com/a.jpg" }] })).toBeUndefined();
    expect(pickRender({ assets: [{ key: "main-raw", value: "https://render.worldofwarcraft.com/forever-us/a.png" }] })).toBe(
      "https://render.worldofwarcraft.com/forever-us/a.png"
    );
    expect(pickRender({ nothing: true })).toBeUndefined();
  });
});

describe("mapPlayableNames", () => {
  it("keys class and race names by English, with every locale Battle.net sends", () => {
    const names = mapPlayableNames([
      { classes: [{ id: 11, name: { en_US: "Druid", pt_BR: "Druida", zh_CN: "德鲁伊" } }] },
      {
        races: [
          { id: 4, name: { en_US: "Night Elf", pt_BR: "Elfo Noturno" } },
          { id: 24, name: { en_US: "Pandaren", pt_BR: "Pandaren" } },
          { id: 25, name: { en_US: "Pandaren", pt_BR: "Pandaren (Aliança)" } },
          { id: 0, name: "" },
        ],
      },
      { unexpected: true },
    ]);
    expect(names.get("Druid")).toEqual({ "en-us": "Druid", "pt-br": "Druida", "zh-cn": "德鲁伊" });
    expect(names.get("Night Elf")?.["pt-br"]).toBe("Elfo Noturno");
    expect(names.get("Pandaren")?.["pt-br"]).toBe("Pandaren");
    expect(names.size).toBe(3);
  });
});
