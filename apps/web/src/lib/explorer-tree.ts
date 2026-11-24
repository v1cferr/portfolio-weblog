import "server-only";

import { compareDesc, localize } from "@workspace/content";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import { getContent } from "./content";

/** A page of the site, shown as a file. */
export interface ExplorerFile {
  kind: "file";
  /** File name, in mono: the slug or id the URL ends with. */
  name: string;
  /** Localized title, shown next to the name. */
  label: string;
  /** Locale-less path, for the i18n Link. */
  href: string;
  /** Language of the label when it differs from the page (a post served in another locale). */
  lang?: string;
  icon: "page" | "post";
}

/** A section or a date bucket, shown as a folder. */
export interface ExplorerFolder {
  kind: "folder";
  name: string;
  /** Stable key, also used to remember whether it is open: "~/weblog/2026". */
  path: string;
  label?: string;
  children: ExplorerNode[];
}

export type ExplorerNode = ExplorerFile | ExplorerFolder;

/**
 * The site as a file tree (`~/weblog/2026/11/<slug>`), built from the public
 * registry: section pages are files, sections with entries are folders whose
 * `index` is the section page, and posts sit under their year and month,
 * newest first, like their folders in content/ (ADR 0012).
 */
export async function buildExplorerTree(locale: Locale): Promise<ExplorerFolder> {
  const content = getContent();
  const [nav, footer] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Footer" }),
  ]);
  const index = (href: string, label: string): ExplorerFile => ({ kind: "file", name: "index", label, href, icon: "page" });
  const page = (key: "about" | "education" | "setup" | "timeline" | "now" | "next" | "wow"): ExplorerFile => ({
    kind: "file",
    name: key,
    label: key === "now" || key === "next" ? footer(key) : nav(key),
    href: `/${key}`,
    icon: "page",
  });

  const career: ExplorerFolder = {
    kind: "folder",
    name: "career",
    path: "~/career",
    label: nav("career"),
    children: [
      index("/career", nav("career")),
      ...content.getExperiences().map((experience): ExplorerFile => {
        const organization = content.getOrganization(experience.organization)?.name ?? experience.id;
        const latest = experience.positions.at(-1);
        return {
          kind: "file",
          name: experience.id,
          label: latest === undefined ? organization : `${localize(latest.title, locale).value} · ${organization}`,
          href: `/career/${experience.id}`,
          icon: "page",
        };
      }),
    ],
  };

  // Newest first, like every dated list on the site; undated projects last, by title.
  const projects: ExplorerFolder = {
    kind: "folder",
    name: "projects",
    path: "~/projects",
    label: nav("projects"),
    children: [
      index("/projects", nav("projects")),
      ...[...content.getProjects()]
        .sort((a, b) => compareDesc(a.startedAt ?? "0000", b.startedAt ?? "0000") || a.title.localeCompare(b.title))
        .map((project): ExplorerFile => ({
          kind: "file",
          name: project.id,
          label: project.title,
          href: `/projects/${project.id}`,
          icon: "page",
        })),
    ],
  };

  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  const years = new Map<string, Map<string, ExplorerFile[]>>();
  // getPosts is already newest first, so each month keeps that order.
  for (const post of content.getPosts(locale)) {
    const [year = "", month = ""] = post.folderDate.split("-");
    const months = years.get(year) ?? new Map<string, ExplorerFile[]>();
    const files = months.get(month) ?? [];
    files.push({
      kind: "file",
      name: post.slug,
      label: post.frontmatter.title,
      href: `/weblog/${post.slug}`,
      ...(post.locale !== locale && { lang: post.locale }),
      icon: "post",
    });
    months.set(month, files);
    years.set(year, months);
  }
  const desc = (a: string, b: string) => b.localeCompare(a);
  const weblog: ExplorerFolder = {
    kind: "folder",
    name: "weblog",
    path: "~/weblog",
    label: nav("weblog"),
    children: [
      index("/weblog", nav("weblog")),
      ...[...years.keys()].sort(desc).map((year): ExplorerFolder => ({
        kind: "folder",
        name: year,
        path: `~/weblog/${year}`,
        children: [...(years.get(year)?.keys() ?? [])].sort(desc).map((month): ExplorerFolder => ({
          kind: "folder",
          name: month,
          path: `~/weblog/${year}/${month}`,
          label: monthName.format(new Date(Date.UTC(Number(year), Number(month) - 1, 1))),
          children: years.get(year)?.get(month) ?? [],
        })),
      })),
    ],
  };

  return {
    kind: "folder",
    name: "~",
    path: "~",
    children: [
      index("/", nav("home")),
      page("about"),
      career,
      page("education"),
      page("next"),
      page("now"),
      projects,
      page("setup"),
      page("timeline"),
      weblog,
      page("wow"),
    ],
  };
}
