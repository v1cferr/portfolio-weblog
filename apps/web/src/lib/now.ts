import "server-only";

import {
  daysSince,
  loadNow,
  localize,
  localizeList,
  NOW_STALE_AFTER_DAYS,
  type NowEntry,
  type NowLog,
  type Resolved,
} from "@workspace/content";
import type { SearchDocument } from "@workspace/search";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import { CONTENT_ROOT, getContent } from "./content";
import { ownerTitle } from "./current-role";

let log: NowLog | undefined;

/** The public now log and next plans; rebuilt on every call in development, like the registry. */
export function getNow(): NowLog {
  if (process.env.NODE_ENV === "development") return loadNow(CONTENT_ROOT);
  log ??= loadNow(CONTENT_ROOT);
  return log;
}

/** A bullet of the now log: written by the owner, or derived from the rest of the content. */
export type NowItem =
  | { kind: "text"; text: Resolved<string> }
  | { kind: "role"; title: Resolved<string> }
  | { kind: "projects"; projects: { id: string; title: string }[]; more: number }
  | { kind: "post"; slug: string; title: string; locale: Locale };

/** At most this many active projects are named in one bullet; the rest is a count. */
const PROJECTS_SHOWN = 3;

/**
 * The bullets that come from the content, not from content/now: the current
 * role, the projects marked active and the newest post in this language. They
 * are computed when the page renders, so they are as current as the build.
 */
export function derivedNowItems(locale: Locale): NowItem[] {
  const content = getContent();
  const items: NowItem[] = [{ kind: "role", title: ownerTitle(locale) }];
  const active = content.getProjects().filter((project) => project.state === "active");
  if (active.length > 0) {
    items.push({
      kind: "projects",
      projects: active.slice(0, PROJECTS_SHOWN).map(({ id, title }) => ({ id, title })),
      more: Math.max(0, active.length - PROJECTS_SHOWN),
    });
  }
  const post = content.getPosts(locale)[0];
  if (post !== undefined) items.push({ kind: "post", slug: post.slug, title: post.frontmatter.title, locale: post.locale });
  return items;
}

/** The owner's own bullets and note of one update, in this language or its fallback. */
export function writtenNow(entry: NowEntry, locale: Locale) {
  const items = localizeList(entry.items, locale);
  return {
    note: entry.note === undefined ? undefined : localize(entry.note, locale),
    items:
      items === undefined
        ? []
        : items.value.map((value): NowItem => ({ kind: "text", text: { value, locale: items.locale, isFallback: items.isFallback } })),
  };
}

/**
 * How old the newest update is. The site is static: this is computed when a
 * page is rendered (at build time, then again on every ISR revalidation, once
 * a day), so "N days ago" can lag by at most a day. ADR 0011.
 */
export function nowAge(entry: NowEntry, today: Date = new Date()) {
  const days = daysSince(entry.date, today);
  return { days, stale: days > NOW_STALE_AFTER_DAYS };
}

/**
 * Search documents for /now and /next: the owner's own words of the newest
 * update and the plans (the derived bullets are already indexed where they
 * come from).
 */
export async function nowSearchDocuments(locale: Locale): Promise<SearchDocument[]> {
  const [now, next] = await Promise.all([getTranslations({ locale, namespace: "Now" }), getTranslations({ locale, namespace: "Next" })]);
  const log = getNow();
  const docs: SearchDocument[] = [];
  const entry = log.entries[0];
  if (entry !== undefined) {
    const written = writtenNow(entry, locale);
    const texts = written.items.flatMap((item) => (item.kind === "text" ? [item.text.value] : []));
    docs.push({
      id: `page:now:${locale}`,
      entityId: "now",
      type: "page",
      locale: written.items[0]?.kind === "text" ? written.items[0].text.locale : locale,
      section: "now",
      title: now("title"),
      keywords: now("description"),
      text: [written.note?.value, ...texts].filter((part) => part !== undefined).join(" \n"),
      excerpt: texts[0] ?? now("description"),
      url: `/${locale}/now`,
    });
  }
  const plans = log.next === undefined ? undefined : localizeList(log.next.items, locale);
  if (plans !== undefined) {
    docs.push({
      id: `page:next:${locale}`,
      entityId: "next",
      type: "page",
      locale: plans.locale,
      section: "now",
      title: next("title"),
      keywords: next("description"),
      text: plans.value.join(" \n"),
      excerpt: plans.value[0] ?? next("description"),
      url: `/${locale}/next`,
    });
  }
  return docs;
}

/** The newest update with every bullet the home card and /now show for it: written ones first, then the derived ones. */
export function latestNow(locale: Locale) {
  const entry = getNow().entries[0];
  if (entry === undefined) return undefined;
  const written = writtenNow(entry, locale);
  return { entry, note: written.note, written: written.items, derived: derivedNowItems(locale), age: nowAge(entry) };
}
