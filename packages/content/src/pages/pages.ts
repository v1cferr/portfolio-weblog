import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { parseFrontmatter } from "../loaders/load";
import type { ContentIssue } from "../loaders/errors";
import { ContentValidationError } from "../loaders/errors";
import { DEFAULT_LOCALE, LOCALES, type Locale, PageFrontmatter } from "../schemas";

/*
 * Standalone prose pages: content/pages/<slug>/<locale>.mdx.
 * Like the now log they have no ids or relations, so they load on their own
 * instead of going through the registry; content:check validates them all the
 * same.
 */

export interface PageSource {
  slug: string;
  locale: Locale;
  frontmatter: PageFrontmatter;
  /** Raw MDX body; compiled by the web app, never executed here. */
  body: string;
  /** Relative to the content root ("pages/<slug>/en-us.mdx"). */
  file: string;
}

export interface PagesLoadResult {
  pages: PageSource[];
  issues: ContentIssue[];
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Reads content/pages/. Never throws for invalid content: problems come back as issues. */
export function loadPagesContent(root: string): PagesLoadResult {
  const dir = path.join(root, "pages");
  const issues: ContentIssue[] = [];
  const pages: PageSource[] = [];
  if (!existsSync(dir)) return { pages, issues };
  const rel = (file: string) => path.relative(root, file);

  for (const slug of readdirSync(dir).sort()) {
    const pageDir = path.join(dir, slug);
    if (slug.startsWith(".") || !statSync(pageDir).isDirectory()) continue;
    if (!SLUG.test(slug)) {
      issues.push({ file: rel(pageDir), message: "page directories are kebab-case slugs" });
      continue;
    }
    for (const name of readdirSync(pageDir).sort()) {
      if (!name.endsWith(".mdx")) continue;
      const file = path.join(pageDir, name);
      const locale = name.slice(0, -".mdx".length);
      if (!(LOCALES as readonly string[]).includes(locale)) {
        issues.push({ file: rel(file), message: `file name must be a locale (${LOCALES.join(", ")})` });
        continue;
      }
      let parsed: { data: unknown; content: string };
      try {
        parsed = parseFrontmatter(readFileSync(file, "utf8"));
      } catch (error) {
        issues.push({ file: rel(file), message: `invalid frontmatter: ${(error as Error).message}` });
        continue;
      }
      const result = PageFrontmatter.safeParse(parsed.data);
      if (!result.success) {
        issues.push({
          file: rel(file),
          message: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; "),
        });
        continue;
      }
      pages.push({ slug, locale: locale as Locale, frontmatter: result.data, body: parsed.content, file: rel(file) });
    }
  }
  return { pages, issues };
}

/** Only published, public translations: what any public page may show. */
export function publicPages(pages: PageSource[]): PageSource[] {
  return pages.filter((page) => page.frontmatter.status === "published" && page.frontmatter.visibility === "public");
}

/** Loads the public pages; throws with every problem when the files are invalid. */
export function loadPages(root: string): PageSource[] {
  const { pages, issues } = loadPagesContent(root);
  if (issues.length > 0) throw new ContentValidationError(issues);
  return publicPages(pages);
}

/** One page in the requested locale, or in English flagged as a fallback (zh-cn reads English content). */
export function findPage(
  pages: PageSource[],
  slug: string,
  locale: Locale
): (PageSource & { isFallback: boolean; availableLocales: Locale[] }) | undefined {
  const translations = pages.filter((page) => page.slug === slug);
  const availableLocales = translations.map((page) => page.locale);
  const exact = translations.find((page) => page.locale === locale);
  if (exact !== undefined) return { ...exact, isFallback: false, availableLocales };
  const fallback = translations.find((page) => page.locale === DEFAULT_LOCALE);
  return fallback === undefined ? undefined : { ...fallback, isFallback: true, availableLocales };
}
