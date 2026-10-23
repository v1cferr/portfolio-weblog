import "server-only";

import { fetchPublicRepos, type GitHubRepo } from "@workspace/github";
import { cache } from "react";

export const GITHUB_USER = "v1cferr";

/** How long GitHub metadata may be served from cache: it is enrichment, not the source of truth. */
export const GITHUB_REVALIDATE_SECONDS = 86_400;

export type RepoIndex = { ok: true; get: (fullName: string) => GitHubRepo | undefined; repos: GitHubRepo[] } | { ok: false; error: string };

/**
 * Public repositories of the hub's owner, fetched at most once per render and
 * cached by Next for a day. A failure yields `ok: false`; pages then render
 * from content alone.
 */
export const getRepoIndex = cache(async (): Promise<RepoIndex> => {
  const result = await fetchPublicRepos({
    user: GITHUB_USER,
    token: process.env.GITHUB_TOKEN,
    init: { next: { revalidate: GITHUB_REVALIDATE_SECONDS, tags: ["github"] } },
  });
  if (!result.ok) {
    console.warn(`GitHub enrichment unavailable: ${result.error}`);
    return { ok: false, error: result.error };
  }
  const byName = new Map(result.repos.map((repo) => [repo.full_name.toLowerCase(), repo]));
  return { ok: true, repos: result.repos, get: (fullName) => byName.get(fullName.toLowerCase()) };
});
