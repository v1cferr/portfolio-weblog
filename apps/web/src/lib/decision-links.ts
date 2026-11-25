import { REPOSITORY_URL } from "./site";

/*
 * Links to and inside the architecture decision records (docs/decisions/).
 * The records are written for GitHub, so their links are relative to the
 * folder; on the site, a link to another record opens its page here, and a
 * link to any other file of the repository opens it on GitHub.
 */

/** The page of one record, without the locale: "/decisions/0006". */
export function decisionPath(number: string): string {
  return `/decisions/${number}`;
}

/** A repository file as GitHub shows it on main. */
export function repositoryFileUrl(file: string): string {
  return `${REPOSITORY_URL}/blob/main/${file}`;
}

const OWN_DECISIONS = new RegExp(
  `^${REPOSITORY_URL.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/(?:blob|tree)/[^/]+/docs/decisions(?:/(\\d{4})-[a-z0-9-]+\\.md)?/?(#[\\w-]*)?$`
);

/**
 * This site's own records, linked from content as GitHub URLs (a case study's
 * `adr` and `adrs`), mapped to their pages here: a record to /decisions/NNNN,
 * the folder to /decisions. Any other URL, another repository's ADRs included,
 * gives undefined and stays as it is.
 */
export function onSiteDecisionPath(url: string): string | undefined {
  const match = OWN_DECISIONS.exec(url);
  if (match === null) return undefined;
  return match[1] === undefined ? "/decisions" : `${decisionPath(match[1])}${match[2] ?? ""}`;
}

const SIBLING = /^(\d{4})-[a-z0-9-]+\.md(#[\w-]*)?$/;

/**
 * Where a link inside a record points on the site: another record becomes its
 * page here, any other relative path that file on GitHub. Absolute URLs,
 * anchors and site paths are left as they are.
 */
export function resolveDecisionLink(href: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("/")) return href;
  const sibling = SIBLING.exec(href);
  if (sibling?.[1] !== undefined) return `${decisionPath(sibling[1])}${sibling[2] ?? ""}`;
  // Resolve ./ and ../ against docs/decisions/ without node:path, so this stays usable anywhere.
  const parts = ["docs", "decisions"];
  for (const part of href.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  return repositoryFileUrl(parts.join("/"));
}

/** Rewrites every Markdown link target of a record body (see resolveDecisionLink). */
export function rewriteDecisionLinks(markdown: string): string {
  return markdown.replace(/\]\(([^)\s]+)\)/g, (_, href: string) => `](${resolveDecisionLink(href)})`);
}
