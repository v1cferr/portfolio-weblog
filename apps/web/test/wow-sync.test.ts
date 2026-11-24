import { Wow } from "@workspace/content";
import { describe, expect, it } from "vitest";

import { mapAccountCharacter, mapAccountSummary, mergeCharacters, rulesetOf } from "../src/lib/wow-sync";

const retailRaw = {
  name: "Fearvy",
  realm: { name: "Stormrage", slug: "stormrage" },
  playable_class: { name: "Paladin" },
  playable_race: { name: "Human" },
  faction: { type: "ALLIANCE" },
  level: 90,
};
const foreverRaw = {
  name: "Judgement",
  surname: "Judy",
  playable_class: { name: "Priest" },
  playable_race: { name: "Dwarf" },
  faction: { type: "ALLIANCE" },
  ruleset: { name: "Normal" },
  level: 42,
};

describe("wow sync mapping", () => {
  it("maps Retail characters with a realm and an armory link", () => {
    expect(mapAccountCharacter("retail", "us", retailRaw)).toEqual({
      game: "retail",
      name: "Fearvy",
      region: "us",
      class: "Paladin",
      race: "Human",
      faction: "alliance",
      level: 90,
      realm: "Stormrage",
      armoryUrl: "https://worldofwarcraft.blizzard.com/en-us/character/us/stormrage/fearvy",
    });
  });

  it("keeps a realm slug only when it differs from the derived one", () => {
    expect(mapAccountCharacter("retail", "eu", { ...retailRaw, realm: { name: "Aman'Thul", slug: "amanthul" } })).not.toHaveProperty(
      "realmSlug"
    );
    expect(mapAccountCharacter("retail", "eu", { ...retailRaw, realm: { name: "Odd", slug: "odd-realm" } })).toHaveProperty(
      "realmSlug",
      "odd-realm"
    );
  });

  it("maps Forever characters with surname and ruleset, and no realm", () => {
    expect(mapAccountCharacter("forever", "us", foreverRaw)).toEqual({
      game: "forever",
      name: "Judgement",
      region: "us",
      class: "Priest",
      race: "Dwarf",
      faction: "alliance",
      level: 42,
      surname: "Judy",
      ruleset: "normal",
    });
    expect(mapAccountCharacter("forever", "us", { ...foreverRaw, surname: undefined })).toBeUndefined();
  });

  it("reads ruleset names however they come", () => {
    expect(rulesetOf({ name: "RP-PvP" })).toBe("rp-pvp");
    expect(rulesetOf({ name: { en_US: "Roleplaying PvP" } })).toBe("rp-pvp");
    expect(rulesetOf("Hardcore")).toBe("hardcore");
    expect(rulesetOf({ name: "Seasonal" })).toBeUndefined();
  });

  it("walks every account and counts what it could not map", () => {
    const summary = { wow_accounts: [{ characters: [retailRaw, { name: "No realm" }] }, { characters: [{ ...retailRaw, name: "Alt" }] }] };
    const { characters, skipped } = mapAccountSummary("retail", "us", summary);
    expect(characters.map((c) => c.name)).toEqual(["Fearvy", "Alt"]);
    expect(skipped).toBe(1);
    expect(mapAccountSummary("retail", "us", {})).toEqual({ characters: [], skipped: 0 });
  });
});

describe("wow sync merge", () => {
  const found = [mapAccountCharacter("retail", "us", retailRaw), mapAccountCharacter("forever", "us", foreverRaw)].filter(
    (c): c is Record<string, unknown> => c !== undefined
  );

  it("adds new characters, live only at the level cap, and the result is valid content", () => {
    const merged = mergeCharacters([], found, new Set(["retail:us", "forever:us"]));
    expect(merged.added).toEqual(["Fearvy (retail, US)", "Judgement Judy (forever, US)"]);
    expect(merged.characters.map((c) => c.live)).toEqual([true, false]);
    expect(Wow.safeParse({ characters: merged.characters }).success).toBe(true);
  });

  it("refreshes synced fields and keeps the owner's", () => {
    const existing = [
      {
        game: "retail",
        name: "Fearvy",
        region: "us",
        realm: "Stormrage",
        level: 80,
        live: false,
        main: true,
        note: { "en-us": "My first" },
        armoryUrl: "https://example.com/custom",
      },
    ];
    const merged = mergeCharacters(existing, found, new Set(["retail:us"]));
    expect(merged.characters[0]).toEqual({
      ...existing[0],
      level: 90,
      class: "Paladin",
      race: "Human",
      faction: "alliance",
    });
    expect(merged.updated).toEqual(["Fearvy (retail, US)"]);
  });

  it("keeps characters Battle.net did not list, and reports them only for what was read", () => {
    const gone = { game: "retail", name: "Oldalt", region: "us", realm: "Azralon" };
    const elsewhere = { game: "retail", name: "Eualt", region: "eu", realm: "Silvermoon" };
    const merged = mergeCharacters([gone, elsewhere], [], new Set(["retail:us"]));
    expect(merged.characters).toEqual([gone, elsewhere]);
    expect(merged.missing).toEqual(["Oldalt (retail, US)"]);
  });
});
