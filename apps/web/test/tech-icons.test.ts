import { describe, expect, it } from "vitest";

import { groupByIcon } from "../src/lib/tech-icons";

describe("groupByIcon", () => {
  it("merges technologies that draw the same logo, in order, and names them all", () => {
    const groups = groupByIcon([
      { id: "nix", name: "Nix", icon: "si:nixos" },
      { id: "react", name: "React", icon: "si:react" },
      { id: "nixos", name: "NixOS", icon: "si:nixos" },
    ]);
    expect(groups.map((group) => group.label)).toEqual(["Nix · NixOS", "React"]);
    expect(groups[0]?.lead.id).toBe("nix");
    expect(groups[0]?.techs.map((tech) => tech.id)).toEqual(["nix", "nixos"]);
  });

  it("never merges technologies without a logo of their own", () => {
    const groups = groupByIcon([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    expect(groups.map((group) => group.key)).toEqual(["id:a", "id:b"]);
  });
});
