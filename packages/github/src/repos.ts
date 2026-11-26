import { z } from "zod";

import { githubGet, type GitHubRequestOptions } from "./http";

/** The fields this hub uses from GET /users/{user}/repos. Unknown fields are ignored. */
export const GitHubRepo = z.object({
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
  visibility: z.string().optional(),
  fork: z.boolean(),
  archived: z.boolean(),
  description: z.string().nullable(),
  html_url: z.url(),
  homepage: z.string().nullable().optional(),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  stargazers_count: z.number(),
  created_at: z.string(),
  pushed_at: z.string().nullable(),
});
export type GitHubRepo = z.infer<typeof GitHubRepo>;

export type ReposResult = { ok: true; repos: GitHubRepo[] } | { ok: false; error: string; status?: number };

export interface FetchReposOptions extends GitHubRequestOptions {
  user: string;
  perPage?: number;
  /** Upper bound on pages, so a pagination bug can never loop forever. */
  maxPages?: number;
}

/** A repository counts as public only when GitHub says so explicitly. */
export function isPublicRepo(repo: GitHubRepo): boolean {
  return !repo.private && (repo.visibility === undefined || repo.visibility === "public");
}

function nextPageUrl(link: string | null): string | undefined {
  if (link === null) return undefined;
  for (const part of link.split(",")) {
    const match = /<([^>]+)>;\s*rel="next"/.exec(part);
    if (match?.[1] !== undefined) return match[1];
  }
  return undefined;
}

/**
 * Every public repository owned by `user`, following pagination. Private
 * repositories are dropped even if the token could see them. Failures are
 * returned, not thrown: callers render their own content without GitHub.
 */
export async function fetchPublicRepos(options: FetchReposOptions): Promise<ReposResult> {
  const { user, perPage = 100, maxPages = 10 } = options;

  const repos: GitHubRepo[] = [];
  let url: string | undefined =
    `https://api.github.com/users/${encodeURIComponent(user)}/repos?type=owner&sort=pushed&per_page=${String(perPage)}`;

  for (let page = 0; url !== undefined; page++) {
    if (page >= maxPages) return { ok: false, error: `stopped after ${String(maxPages)} pages` };

    const result = await githubGet(url, options);
    if (!result.ok) return result;
    const { response } = result;

    const parsed = z.array(z.unknown()).safeParse(await response.json());
    if (!parsed.success) return { ok: false, error: "unexpected response shape" };
    for (const item of parsed.data) {
      const repo = GitHubRepo.safeParse(item);
      if (repo.success && isPublicRepo(repo.data)) repos.push(repo.data);
    }
    url = nextPageUrl(response.headers.get("link"));
  }

  return { ok: true, repos };
}
