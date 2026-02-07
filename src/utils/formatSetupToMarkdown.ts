interface ISetupItem {
  name: string;
  description: string;
  url?: string;
  review?: string;
  date?: string;
  endDate?: string;
}

interface ISetupCategory {
  category: string;
  items: ISetupItem[];
}

/**
 * Formats the setup data into a markdown string.
 *
 * @param data - The setup data components.
 * @returns The formatted markdown string.
 */
export function formatSetupToMarkdown(data: ISetupCategory[]): string {
  const sections = data.map((section) => {
    const items = section.items
      .map((item) => {
        const link = item.url ? `(${item.url})` : "";
        return `- **${item.name}**: [${item.description}]${link}`;
      })
      .join("\n");

    return `## ${section.category}\n\n${items}`;
  });

  return `# Meu Setup\n\n${sections.join("\n\n")}`;
}
