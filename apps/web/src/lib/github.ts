import "server-only";

import {
  createLimiter,
  fetchPublicRepos,
  fetchRepoLanguages,
  type GitHubRepo,
  type LanguageShare,
  languageShares,
  type ReposResult,
} from "@workspace/github";
import { cache } from "react";

import linguist from "@/generated/linguist-colors.json";

import { FIXTURE_REPOS, FIXTURE_TAKEN_AT, fixtureLanguages } from "./github-fixture";

export const GITHUB_USER = "v1cferr";

/** How long GitHub metadata may be served from cache: it is enrichment, not the source of truth. */
export const GITHUB_REVALIDATE_SECONDS = 86_400;

/**
 * Builds made with GITHUB_FIXTURES=1 (CI and the e2e suite) read a committed
 * snapshot instead of the network, so tests never hit GitHub or its rate limit.
 */
const FIXTURES = process.env.GITHUB_FIXTURES === "1";

/** "Now" for what is computed from GitHub data: the snapshot's date under fixtures, so builds stay the same over time. */
export function githubNow(): Date {
  return FIXTURES ? FIXTURE_TAKEN_AT : new Date();
}

/** Every request carries the same cache policy: Next's data cache, revalidated daily, purgeable by the "github" tag. */
const requestOptions = () => ({
  token: process.env.GITHUB_TOKEN,
  init: { next: { revalidate: GITHUB_REVALIDATE_SECONDS, tags: ["github"] } },
});

/** At most four requests to GitHub at once, however many cards a page renders. */
const limit = createLimiter(4);

/** One warning per distinct failure, not one per project and page. */
const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

export type RepoIndex = { ok: true; get: (fullName: string) => GitHubRepo | undefined; repos: GitHubRepo[] } | { ok: false; error: string };

/**
 * Public repositories of the hub's owner, fetched at most once per render and
 * cached by Next for a day. A failure yields `ok: false`; pages then render
 * from content alone.
 */
export const getRepoIndex = cache(async (): Promise<RepoIndex> => {
  const result: ReposResult = FIXTURES
    ? { ok: true, repos: FIXTURE_REPOS }
    : await fetchPublicRepos({ user: GITHUB_USER, ...requestOptions() });
  if (!result.ok) {
    warnOnce(`GitHub enrichment unavailable: ${result.error}`);
    return { ok: false, error: result.error };
  }
  const byName = new Map(result.repos.map((repo) => [repo.full_name.toLowerCase(), repo]));
  return { ok: true, repos: result.repos, get: (fullName) => byName.get(fullName.toLowerCase()) };
});

/** GitHub's grey for languages linguist gives no colour, and for the "other" slice. */
export const NEUTRAL_LANGUAGE_COLOR = "#8b949e";

const COLORS: Readonly<Record<string, string>> = linguist.colors;

/** A language's colour on GitHub (github-linguist's languages.yml, vendored by `pnpm --filter web linguist:colors`). */
export function languageColor(name: string): string {
  return COLORS[name] ?? NEUTRAL_LANGUAGE_COLOR;
}

/** One slice of a language bar, ready to draw. */
export interface LanguageSlice extends LanguageShare {
  color: string;
}

export interface RepoLanguages {
  repo: GitHubRepo;
  /** Largest first; the last one may gather the languages under 1% (`other`). */
  languages: LanguageSlice[];
  /** When GitHub produced the numbers (ISO), if it said. */
  fetchedAt?: string | undefined;
}

/**
 * The languages of a project's repository, as GitHub lists them. Only for a
 * repository the public index has: a private, deleted or renamed one has no
 * languages section, silently, and neither does an empty one. Any failure is
 * logged once and leaves the page as it would be without GitHub.
 */
export const getRepoLanguages = cache(async (fullName: string): Promise<RepoLanguages | undefined> => {
  const index = await getRepoIndex();
  const repo = index.ok ? index.get(fullName) : undefined;
  if (repo === undefined) return undefined;
  const result = FIXTURES ? fixtureLanguages(repo.full_name) : await limit(() => fetchRepoLanguages(repo.full_name, requestOptions()));
  if (!result.ok) {
    if (result.status !== 404) warnOnce(`GitHub languages unavailable: ${result.error}`);
    return undefined;
  }
  const languages = languageShares(result.languages).map((share) => ({
    ...share,
    color: share.other === true ? NEUTRAL_LANGUAGE_COLOR : languageColor(share.name),
  }));
  return languages.length > 0 ? { repo, languages, fetchedAt: result.fetchedAt } : undefined;
});
