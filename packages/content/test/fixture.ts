import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { stringify } from "yaml";

export const profile = {
  id: "me",
  name: "Test Person",
  handle: "tester",
  headline: { "en-us": "Engineer" },
  summary: { "en-us": "Summary", "pt-br": "Resumo" },
};

export const organizations = [
  { id: "acme", name: "Acme", kind: "company" },
  { id: "secret-corp", name: "Secret", kind: "company", visibility: "private" },
  { id: "uni", name: "University", kind: "university" },
];

export const technologies = [
  { id: "typescript", name: "TypeScript", category: "language" },
  { id: "python", name: "Python", category: "language" },
];

/**
 * Writes a content tree to a temporary directory. Keys are paths relative to
 * the content root; objects are serialized as YAML, strings written as-is.
 */
export function makeContent(files: Record<string, unknown>): string {
  const root = mkdtempSync(path.join(tmpdir(), "content-"));
  const base: Record<string, unknown> = {
    "profile/profile.yaml": profile,
    "taxonomies/organizations.yaml": organizations,
    "taxonomies/technologies.yaml": technologies,
  };
  for (const [rel, data] of Object.entries({ ...base, ...files })) {
    if (data === undefined) continue;
    const file = path.join(root, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, typeof data === "string" ? data : stringify(data));
  }
  return root;
}

export function post(frontmatter: Record<string, unknown>, body = "Hello."): string {
  return `---\n${stringify(frontmatter)}---\n\n${body}\n`;
}

export const experience = (overrides: Record<string, unknown> = {}) => ({
  id: "acme-dev",
  organization: "acme",
  positions: [{ title: { "en-us": "Developer" }, start: "2023-01", end: "2024-06" }],
  summary: { "en-us": "Built things." },
  technologies: ["typescript"],
  ...overrides,
});

export const project = (overrides: Record<string, unknown> = {}) => ({
  id: "hub",
  title: "Hub",
  summary: { "en-us": "A hub." },
  state: "active",
  category: "personal",
  ...overrides,
});
