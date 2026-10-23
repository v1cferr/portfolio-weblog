import { localize, type Setup } from "@workspace/content";

import type { Locale } from "@/i18n/routing";

/**
 * The setup as Markdown, for forums and chats, in v1's format: one section per
 * group, "- **Role**: [Model](url)". Only what is in use: retired parts (with
 * an end date) are left out.
 */
export function setupToMarkdown(setup: Pick<Setup, "groups">, locale: Locale, heading: string): string {
  const sections = setup.groups.flatMap((group) => {
    const items = group.items.filter((item) => item.until === undefined);
    if (items.length === 0) return [];
    const lines = items.map((item) => {
      const model = item.url !== undefined ? `[${item.model}](${item.url})` : item.model;
      return `- **${localize(item.role, locale).value}**: ${model}`;
    });
    return [`## ${localize(group.title, locale).value}\n\n${lines.join("\n")}`];
  });
  return `# ${heading}\n\n${sections.join("\n\n")}\n`;
}
