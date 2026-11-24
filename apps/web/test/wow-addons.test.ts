import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { addonHref, addonName, groupAddons, parseAddonSources } from "../src/lib/wow-addons";

const sources = {
  questie: {
    source: "github",
    repo: "Questie/Questie",
    version: "bundle/v12.12.0+v1.1.4",
    url: "https://github.com/Questie/Questie/releases/download/bundle/v12.12.0%2Bv1.1.4/Questie-v12.12.0%2Bv1.1.4.zip",
    hash: "sha256-x",
  },
  "leatrix-plus": {
    source: "curseforge",
    projectId: 94855,
    url: "https://edge.forgecdn.net/files/9744/906/Leatrix_Plus-1.60.37-forever.zip",
  },
  buggrabber: { source: "curseforge", projectId: 13344, url: "https://edge.forgecdn.net/files/9277/326/!BugGrabber-v12.1.1.zip" },
  prat: { source: "curseforge", projectId: 7473, url: "https://edge.forgecdn.net/files/9509/40/Prat-3.0-3.9.117.zip" },
  "lfg-forever": { source: "curseforge", projectId: 1707849, url: "https://edge.forgecdn.net/files/9747/838/LFGForever.zip" },
  "happy-camper": { source: "local" },
};

describe("wow add-ons", () => {
  it("parses sources.json and rejects other shapes", () => {
    expect(Object.keys(parseAddonSources(sources) ?? {})).toHaveLength(6);
    expect(parseAddonSources({})).toBeUndefined();
    expect(parseAddonSources([1, 2])).toBeUndefined();
    expect(parseAddonSources({ dbm: { source: "github", repo: "not a repo" } })).toBeUndefined();
  });

  it("reads names from the zip, without versions", () => {
    expect(addonName("questie", sources.questie)).toBe("Questie");
    expect(addonName("leatrix-plus", sources["leatrix-plus"])).toBe("Leatrix Plus");
    expect(addonName("buggrabber", sources.buggrabber)).toBe("BugGrabber");
    expect(addonName("prat", sources.prat)).toBe("Prat");
    expect(addonName("lfg-forever", sources["lfg-forever"])).toBe("LFGForever");
    expect(addonName("happy-camper", sources["happy-camper"])).toBe("Happy Camper");
    expect(addonName("prat", sources.prat, { prat: "Prat 3.0" })).toBe("Prat 3.0");
  });

  it("links GitHub repositories and CurseForge projects", () => {
    expect(addonHref(sources.questie)).toBe("https://github.com/Questie/Questie");
    expect(addonHref(sources.prat)).toBe("https://www.curseforge.com/projects/7473");
    expect(addonHref(sources["happy-camper"])).toBeUndefined();
  });

  it("keeps the content's groups and order, drops missing ids and collects the rest under other", () => {
    const groups = groupAddons(sources, [
      { id: "social", title: { "en-us": "Social" }, addons: ["prat", "lfg-forever", "gone"] },
      { id: "empty", title: { "en-us": "Empty" }, addons: ["also-gone"] },
      { id: "quests", title: { "en-us": "Quests" }, addons: ["questie"] },
    ]);
    expect(groups.map((group) => group.id)).toEqual(["social", "quests", "other"]);
    expect(groups[0]?.addons.map((addon) => addon.id)).toEqual(["prat", "lfg-forever"]);
    expect(groups[2]?.addons.map((addon) => addon.name)).toEqual(["BugGrabber", "Happy Camper", "Leatrix Plus"]);
    expect(groups[2]?.addons.find((addon) => addon.id === "happy-camper")).toEqual({
      id: "happy-camper",
      name: "Happy Camper",
      host: "other",
    });
  });

  it("the vendored snapshot parses, and the content groups place every add-on in it", async () => {
    const snapshot = parseAddonSources(JSON.parse(readFileSync(new URL("../src/generated/wow-addons.json", import.meta.url), "utf8")));
    expect(snapshot).toBeDefined();
    const { loadWowContent, findContentRoot } = await import("@workspace/content");
    const wow = loadWowContent(findContentRoot()).wow;
    const groups = groupAddons(snapshot ?? {}, wow?.addons?.groups ?? [], wow?.addons?.names);
    expect(groups.find((group) => group.id === "other")).toBeUndefined();
    expect(groups.flatMap((group) => group.addons)).toHaveLength(Object.keys(snapshot ?? {}).length);
  });
});
