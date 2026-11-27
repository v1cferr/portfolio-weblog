import { describe, expect, it } from "vitest";

import { ContentValidationError, findContentRoot, loadWow, loadWowContent, slugifyRealm, Wow, wowCharacterKey, wowMedia } from "../src";
import { makeContent } from "./fixture";

const forever = { game: "forever", name: "Judgement", surname: "Judy", region: "us", ruleset: "normal", level: 60 };
const retail = { game: "retail", name: "Fearvy", realm: "Stormrage", region: "us", class: "Paladin", faction: "alliance", level: 90 };

describe("wow page content", () => {
  it("accepts an empty page, with defaults", () => {
    expect(Wow.parse({})).toEqual({ status: "published", visibility: "public", characters: [], wishlist: [], screenshots: [] });
  });

  it("tells Forever and Retail characters apart and defaults live to on", () => {
    const wow = Wow.parse({ characters: [forever, retail] });
    expect(wow.characters.map((c) => c.game)).toEqual(["forever", "retail"]);
    expect(wow.characters.every((c) => c.live && !c.main && c.visibility === "public")).toBe(true);
  });

  it("requires a surname on Forever and a realm on Retail", () => {
    expect(Wow.safeParse({ characters: [{ ...forever, surname: undefined }] }).success).toBe(false);
    expect(Wow.safeParse({ characters: [{ ...retail, realm: undefined }] }).success).toBe(false);
    // A Forever character has no realm, and a Retail one no ruleset.
    expect(Wow.safeParse({ characters: [{ ...forever, realm: "Stormrage" }] }).success).toBe(false);
    expect(Wow.safeParse({ characters: [{ ...retail, ruleset: "pvp" }] }).success).toBe(false);
  });

  it("rejects names the game would not allow, unknown rulesets and regions", () => {
    expect(Wow.safeParse({ characters: [{ ...retail, name: "Fear vy" }] }).success).toBe(false);
    expect(Wow.safeParse({ characters: [{ ...retail, name: "Fearvy1" }] }).success).toBe(false);
    expect(Wow.safeParse({ characters: [{ ...retail, name: "Ëlune" }] }).success).toBe(true);
    expect(Wow.safeParse({ characters: [{ ...forever, ruleset: "seasonal" }] }).success).toBe(false);
    expect(Wow.safeParse({ characters: [{ ...forever, region: "cn" }] }).success).toBe(false);
  });

  it("rejects duplicate characters and an add-on in two groups", () => {
    const twice = Wow.safeParse({ characters: [retail, { ...retail, name: "fearvy" }] });
    expect(twice.success).toBe(false);
    const addons = {
      sources: "https://example.com/sources.json",
      package: "https://example.com/pkg",
      groups: [
        { id: "a", title: { "en-us": "A" }, addons: ["dbm"] },
        { id: "b", title: { "en-us": "B" }, addons: ["dbm"] },
      ],
    };
    expect(Wow.safeParse({ addons }).success).toBe(false);
  });

  it("keys characters by game, region, realm or surname, and name", () => {
    const [a, b] = Wow.parse({ characters: [forever, retail] }).characters;
    expect(a && wowCharacterKey(a)).toBe("forever:us:judy:judgement");
    expect(b && wowCharacterKey(b)).toBe("retail:us:stormrage:fearvy");
    expect(slugifyRealm("Aman'Thul")).toBe("amanthul");
    expect(slugifyRealm("Azralon")).toBe("azralon");
    expect(slugifyRealm("Twisting Nether")).toBe("twisting-nether");
    expect(slugifyRealm("Nemesis Tõr")).toBe("nemesis-tor");
  });

  it("loads the file, hides private characters, and reports invalid content", () => {
    const root = makeContent({ "games/wow.yaml": { characters: [forever, { ...retail, visibility: "private" }] } });
    expect(loadWow(root)?.characters.map((c) => c.name)).toEqual(["Judgement"]);
    expect(loadWow(makeContent({ "games/wow.yaml": { status: "draft" } }))).toBeUndefined();
    expect(loadWow(makeContent({}))).toBeUndefined();
    const bad = makeContent({ "games/wow.yaml": { characters: [{ ...retail, level: 0 }] } });
    expect(loadWowContent(bad).issues[0]?.message).toMatch(/characters\.0\.level/);
    expect(() => loadWow(bad)).toThrow(ContentValidationError);
  });

  it("hides characters below minLevel in every game, and those with no level, but keeps them in the file", () => {
    const low = { ...retail, name: "Magnon", level: 6 };
    const unknown = { ...forever, name: "Lunastra", surname: "Gorehorn", level: undefined };
    const root = makeContent({ "games/wow.yaml": { minLevel: 20, characters: [forever, retail, low, unknown] } });
    expect(loadWow(root)?.characters.map((c) => c.name)).toEqual(["Judgement", "Fearvy"]);
    expect(loadWowContent(root).wow?.characters).toHaveLength(4);
    const all = makeContent({ "games/wow.yaml": { characters: [forever, low] } });
    expect(loadWow(all)?.characters).toHaveLength(2);
  });

  it("the real file is valid", () => {
    const { wow, issues } = loadWowContent(findContentRoot());
    expect(issues).toEqual([]);
    expect(wow?.addons?.groups.length).toBeGreaterThan(0);
  });

  it("takes screenshots as media and hands them to the media check", () => {
    const shot = { src: "/wow/screenshots/stormwind.jpg", width: 1920, height: 1080, alt: { "en-us": "Stormwind at night" } };
    const wow = Wow.parse({ screenshots: [shot] });
    expect(wowMedia(wow)).toEqual([{ src: shot.src, width: 1920, height: 1080, file: "games/wow.yaml" }]);
    expect(wowMedia(undefined)).toEqual([]);
    expect(Wow.safeParse({ screenshots: [{ ...shot, src: "https://example.com/a.jpg" }] }).success).toBe(false);
  });
});
