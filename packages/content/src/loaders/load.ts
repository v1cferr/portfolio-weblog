import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";
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
  Technology,
} from "../schemas";
import type { ContentIssue } from "./errors";

export interface Sourced<T> {
  value: T;
  file: string;
}

export interface PostSource {
  slug: string;
  locale: Locale;
  frontmatter: PostFrontmatter;
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
}

export interface LoadResult {
  content: RawContent;
  issues: ContentIssue[];
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

  function posts(dir: string): PostSource[] {
    if (!existsSync(dir)) return [];
    const out: PostSource[] = [];
    for (const slug of readdirSync(dir).sort()) {
      const postDir = path.join(dir, slug);
      if (!statSync(postDir).isDirectory()) continue;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        issues.push({ file: rel(postDir), message: "post directories are kebab-case slugs" });
        continue;
      }
      for (const name of readdirSync(postDir).sort()) {
        if (!name.endsWith(".mdx")) continue;
        const file = path.join(postDir, name);
        const locale = name.slice(0, -".mdx".length);
        if (!(LOCALES as readonly string[]).includes(locale)) {
          issues.push({ file: rel(file), message: `file name must be a locale (${LOCALES.join(", ")})` });
          continue;
        }
        let parsed: matter.GrayMatterFile<string>;
        try {
          // Same YAML 1.2 parser as the .yaml files: js-yaml (gray-matter's
          // default) turns unquoted dates into Date objects.
          parsed = matter(readFileSync(file, "utf8"), { engines: { yaml: (source) => parseYaml(source) as object } });
        } catch (error) {
          issues.push({ file: rel(file), message: `invalid frontmatter: ${(error as Error).message}` });
          continue;
        }
        const frontmatter = parseWith(PostFrontmatter, parsed.data, file);
        if (frontmatter === undefined) continue;
        out.push({ slug, locale: locale as Locale, frontmatter, body: parsed.content, file: rel(file) });
      }
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
