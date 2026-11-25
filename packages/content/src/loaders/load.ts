import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

import {
  Certification,
  Education,
  Experience,
  LOCALES,
  type Locale,
  Organization,
  PostFrontmatter,
  Profile,
  Project,
  Setup,
  Skill,
  StoryFrontmatter,
  Technology,
} from "../schemas";
import type { ContentIssue } from "./errors";

export interface Sourced<T> {
  value: T;
  file: string;
}

export interface PostSource {
  slug: string;
  /**
   * Year and month of the folder the post lives in (`weblog/<YYYY>/<MM>/<slug>`),
   * as "YYYY-MM". The validator holds it to `publishedAt`.
   */
  folderDate: string;
  /** The post's directory, relative to the content root ("weblog/2026/11/<slug>"). */
  dir: string;
  locale: Locale;
  frontmatter: PostFrontmatter;
  /** Raw MDX body; compiled by the web app, never executed here. */
  body: string;
  file: string;
}

export interface StorySource {
  /** Id of the experience the story belongs to (the folder name). */
  experience: string;
  locale: Locale;
  frontmatter: StoryFrontmatter;
  /** Raw MDX body; compiled by the web app, never executed here. */
  body: string;
  file: string;
}

export interface RawContent {
  profile: Sourced<Profile> | undefined;
  setup: Sourced<Setup> | undefined;
  organizations: Sourced<Organization>[];
  technologies: Sourced<Technology>[];
  skills: Sourced<Skill>[];
  experiences: Sourced<Experience>[];
  projects: Sourced<Project>[];
  education: Sourced<Education>[];
  certifications: Sourced<Certification>[];
  posts: PostSource[];
  stories: StorySource[];
}

export interface LoadResult {
  content: RawContent;
  issues: ContentIssue[];
}

/**
 * Splits `---\n<yaml>\n---\n<body>`. Frontmatter is parsed with the same YAML
 * 1.2 parser as the .yaml files, so dates stay strings and nothing else
 * (gray-matter pulled in js-yaml and its CLI dependencies) is needed.
 */
export function parseFrontmatter(source: string): { data: unknown; content: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (match === null) throw new Error("missing frontmatter (the file must start with a --- block)");
  return { data: parseYaml(match[1] ?? "") as unknown, content: match[2] ?? "" };
}

function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`).join("; ");
}

/**
 * Reads every content file under `root` and validates it against its schema.
 * Never throws for invalid content: problems are returned as issues so the
 * checker can report all of them at once.
 */
export function loadContent(root: string): LoadResult {
  const issues: ContentIssue[] = [];
  const rel = (file: string) => path.relative(root, file);

  function readYaml(file: string): unknown {
    try {
      return parseYaml(readFileSync(file, "utf8")) as unknown;
    } catch (error) {
      issues.push({ file: rel(file), message: `invalid YAML: ${(error as Error).message}` });
      return undefined;
    }
  }

  function parseWith<T>(schema: z.ZodType<T>, data: unknown, file: string): T | undefined {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    issues.push({ file: rel(file), message: formatZodError(result.error) });
    return undefined;
  }

  function single<T>(schema: z.ZodType<T>, file: string): Sourced<T> | undefined {
    if (!existsSync(file)) return undefined;
    const value = parseWith(schema, readYaml(file), file);
    return value === undefined ? undefined : { value, file: rel(file) };
  }

  /** A YAML file holding a list of entities. */
  function list<T>(schema: z.ZodType<T>, file: string): Sourced<T>[] {
    if (!existsSync(file)) return [];
    const data = readYaml(file);
    if (data === undefined) return [];
    const value = parseWith(z.array(schema), data, file);
    return (value ?? []).map((item) => ({ value: item, file: rel(file) }));
  }

  /** One entity per `<id>.yaml` file; the file name must match the id. */
  function directory<T extends { id: string }>(schema: z.ZodType<T>, dir: string): Sourced<T>[] {
    if (!existsSync(dir)) return [];
    const out: Sourced<T>[] = [];
    for (const name of readdirSync(dir).sort()) {
      const file = path.join(dir, name);
      if (!name.endsWith(".yaml") || !statSync(file).isFile()) continue;
      const value = parseWith(schema, readYaml(file), file);
      if (value === undefined) continue;
      const expected = name.slice(0, -".yaml".length);
      if (value.id !== expected) {
        issues.push({ file: rel(file), message: `id "${value.id}" must match the file name "${expected}"` });
        continue;
      }
      out.push({ value, file: rel(file) });
    }
    return out;
  }

  /** Subdirectories of `dir`, sorted, without dotfiles. */
  function subdirs(dir: string): string[] {
    return readdirSync(dir)
      .filter((name) => !name.startsWith(".") && statSync(path.join(dir, name)).isDirectory())
      .sort();
  }

  /**
   * Posts live in `weblog/<YYYY>/<MM>/<slug>/<locale>.mdx`. The year and month
   * only organize the tree; the slug alone is the id and the URL, so it must be
   * unique across every folder.
   */
  function posts(dir: string): PostSource[] {
    if (!existsSync(dir)) return [];
    const out: PostSource[] = [];
    const seen = new Map<string, string>();
    for (const year of subdirs(dir)) {
      if (!/^\d{4}$/.test(year)) {
        issues.push({ file: rel(path.join(dir, year)), message: "posts live in weblog/<YYYY>/<MM>/<slug>/; expected a four-digit year" });
        continue;
      }
      for (const month of subdirs(path.join(dir, year))) {
        if (!/^(?:0[1-9]|1[0-2])$/.test(month)) {
          issues.push({ file: rel(path.join(dir, year, month)), message: "expected a two-digit month (01 to 12)" });
          continue;
        }
        for (const slug of subdirs(path.join(dir, year, month))) {
          const postDir = path.join(dir, year, month, slug);
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
            issues.push({ file: rel(postDir), message: "post directories are kebab-case slugs" });
            continue;
          }
          const previous = seen.get(slug);
          if (previous !== undefined) {
            issues.push({
              file: rel(postDir),
              message: `duplicate post slug "${slug}" (also in ${previous}); a slug is a URL and must be unique`,
            });
            continue;
          }
          seen.set(slug, rel(postDir));
          out.push(...translations(postDir, slug, `${year}-${month}`));
        }
      }
    }
    return out;
  }

  /** Reads an MDX file with frontmatter, reporting problems as issues. */
  function readMdx<T>(schema: z.ZodType<T>, file: string): { frontmatter: T; body: string } | undefined {
    let parsed: { data: unknown; content: string };
    try {
      parsed = parseFrontmatter(readFileSync(file, "utf8"));
    } catch (error) {
      issues.push({ file: rel(file), message: `invalid frontmatter: ${(error as Error).message}` });
      return undefined;
    }
    const frontmatter = parseWith(schema, parsed.data, file);
    return frontmatter === undefined ? undefined : { frontmatter, body: parsed.content };
  }

  /**
   * Long-form stories of jobs: `experiences/<id>/story.<locale>.mdx`. The
   * folder sits next to `<id>.yaml`; the validator checks that it has one.
   */
  function stories(dir: string): StorySource[] {
    if (!existsSync(dir)) return [];
    const out: StorySource[] = [];
    for (const experience of subdirs(dir)) {
      const storyDir = path.join(dir, experience);
      for (const name of readdirSync(storyDir).sort()) {
        const file = path.join(storyDir, name);
        const match = /^story\.([a-z-]+)\.mdx$/.exec(name);
        const locale = match?.[1];
        if (locale === undefined || !(LOCALES as readonly string[]).includes(locale)) {
          issues.push({ file: rel(file), message: `expected story.<locale>.mdx (${LOCALES.join(", ")})` });
          continue;
        }
        const parsed = readMdx(StoryFrontmatter, file);
        if (parsed === undefined) continue;
        out.push({ experience, locale: locale as Locale, ...parsed, file: rel(file) });
      }
    }
    return out;
  }

  /** Every `<locale>.mdx` of one post directory. */
  function translations(postDir: string, slug: string, folderDate: string): PostSource[] {
    const out: PostSource[] = [];
    for (const name of readdirSync(postDir).sort()) {
      if (!name.endsWith(".mdx")) continue;
      const file = path.join(postDir, name);
      const locale = name.slice(0, -".mdx".length);
      if (!(LOCALES as readonly string[]).includes(locale)) {
        issues.push({ file: rel(file), message: `file name must be a locale (${LOCALES.join(", ")})` });
        continue;
      }
      const parsed = readMdx(PostFrontmatter, file);
      if (parsed === undefined) continue;
      out.push({ slug, folderDate, dir: rel(postDir), locale: locale as Locale, ...parsed, file: rel(file) });
    }
    return out;
  }

  const content: RawContent = {
    profile: single(Profile, path.join(root, "profile/profile.yaml")),
    setup: single(Setup, path.join(root, "profile/setup.yaml")),
    organizations: list(Organization, path.join(root, "taxonomies/organizations.yaml")),
    technologies: list(Technology, path.join(root, "taxonomies/technologies.yaml")),
    skills: list(Skill, path.join(root, "taxonomies/skills.yaml")),
    experiences: directory(Experience, path.join(root, "experiences")),
    projects: directory(Project, path.join(root, "projects")),
    education: directory(Education, path.join(root, "education")),
    certifications: directory(Certification, path.join(root, "education/certifications")),
    posts: posts(path.join(root, "weblog")),
    stories: stories(path.join(root, "experiences")),
  };

  if (content.profile === undefined && !issues.some((issue) => issue.file.startsWith("profile/profile"))) {
    issues.push({ file: "profile/profile.yaml", message: "the profile is required" });
  }

  return { content, issues };
}

/** Walks up from `start` to the directory holding pnpm-workspace.yaml and returns its content/ folder. */
export function findContentRoot(start: string = process.cwd()): string {
  const fromEnv = process.env.CONTENT_DIR;
  if (fromEnv !== undefined && fromEnv !== "") return path.resolve(/*turbopackIgnore: true*/ fromEnv);
  // Tooling only; bundled apps pass their content root explicitly so the
  // bundler does not trace the whole repository.
  let dir = path.resolve(/*turbopackIgnore: true*/ start);
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return path.join(dir, "content");
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`No pnpm-workspace.yaml found above ${start}; set CONTENT_DIR`);
    dir = parent;
  }
}
