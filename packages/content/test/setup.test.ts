import { describe, expect, it } from "vitest";

import { findContentRoot, loadContent, Setup, vscodeExtensionAnchor } from "../src";

const base = {
  id: "setup",
  updatedAt: "2026-11",
  groups: [{ id: "components", title: { "en-us": "Components" }, items: [{ id: "cpu-ryzen", role: { "en-us": "CPU" }, model: "Ryzen" }] }],
};

const extensions = (groups: unknown) => ({
  ...base,
  vscodeExtensions: { source: "https://github.com/v1cferr/dotfiles/blob/main/extensions.txt", syncedAt: "2026-11-20", groups },
});

const withPartMedia = (media: unknown) => ({
  ...base,
  groups: [
    { id: "components", title: { "en-us": "Components" }, items: [{ id: "cpu-ryzen", role: { "en-us": "CPU" }, model: "Ryzen", media }] },
  ],
});

describe("setup part photos", () => {
  const photo = { src: "/setup/parts/cpu-ryzen.jpg", width: 1200, height: 1200, alt: { "en-us": "The CPU" } };

  it("takes an optional photo, with a credit when it is not the owner's", () => {
    expect(Setup.safeParse(withPartMedia(photo)).success).toBe(true);
    const parsed = Setup.parse(withPartMedia({ ...photo, credit: { label: "AMD", url: "https://www.amd.com/en/newsroom/press-kits" } }));
    expect(parsed.groups[0]?.items[0]?.media?.credit?.label).toBe("AMD");
  });

  it("rejects a credit without an https link", () => {
    expect(Setup.safeParse(withPartMedia({ ...photo, credit: { label: "AMD", url: "http://amd.com" } })).success).toBe(false);
  });
});

describe("setup VS Code extensions", () => {
  it("anchors an extension by its id, dots as dashes", () => {
    expect(vscodeExtensionAnchor("ms-python.vscode-pylance")).toBe("vscode-ms-python-vscode-pylance");
  });

  it("accepts grouped extensions and keeps the list optional", () => {
    expect(Setup.safeParse(base).success).toBe(true);
    const parsed = Setup.parse(extensions([{ id: "git", title: { "en-us": "Git" }, items: [{ id: "eamodio.gitlens", name: "GitLens" }] }]));
    expect(parsed.vscodeExtensions?.groups[0]?.items[0]?.name).toBe("GitLens");
  });

  it("rejects an id that is not publisher.name in lowercase", () => {
    for (const id of ["GitLens", "eamodio", "Eamodio.GitLens"]) {
      expect(Setup.safeParse(extensions([{ id: "git", title: { "en-us": "Git" }, items: [{ id, name: "GitLens" }] }])).success).toBe(false);
    }
  });

  it("rejects an extension listed twice, even in different groups", () => {
    const result = Setup.safeParse(
      extensions([
        { id: "git", title: { "en-us": "Git" }, items: [{ id: "eamodio.gitlens", name: "GitLens" }] },
        { id: "more", title: { "en-us": "More" }, items: [{ id: "eamodio.gitlens", name: "GitLens" }] },
      ])
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("vscode-eamodio-gitlens");
  });

  it("loads the real list without duplicates or problems", () => {
    const { content, issues } = loadContent(findContentRoot());
    expect(issues).toEqual([]);
    const groups = content.setup?.value.vscodeExtensions?.groups ?? [];
    const ids = groups.flatMap((group) => group.items.map((item) => item.id));
    expect(ids.length).toBeGreaterThan(50);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
