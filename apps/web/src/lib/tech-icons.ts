/** What an icon-only row needs from a technology. */
export interface IconTech {
  id: string;
  name: string;
  icon?: string | undefined;
}

/** One icon in an icon-only row, standing for every technology that draws it. */
export interface IconGroup<T extends IconTech> {
  /** The icon reference, or the technology's id when it has no icon of its own. */
  key: string;
  /** The first technology with this icon: its icon and category draw the group. */
  lead: T;
  techs: T[];
  /** The names, joined for the tooltip and the accessible name ("Nix · NixOS"). */
  label: string;
}

/**
 * Groups technologies that resolve to the same logo, keeping the order of
 * first appearance: Nix and NixOS share the snowflake, so an icon-only row
 * shows it once and names both. A technology without an icon of its own falls
 * back to a generic category glyph, which says nothing about the brand, so it
 * is never merged with another.
 */
export function groupByIcon<T extends IconTech>(techs: readonly T[]): IconGroup<T>[] {
  const groups = new Map<string, IconGroup<T>>();
  for (const tech of techs) {
    const key = tech.icon ?? `id:${tech.id}`;
    const group = groups.get(key);
    if (group === undefined) groups.set(key, { key, lead: tech, techs: [tech], label: tech.name });
    else {
      group.techs.push(tech);
      group.label = group.techs.map((item) => item.name).join(" · ");
    }
  }
  return [...groups.values()];
}
