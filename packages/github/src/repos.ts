import { z } from "zod";

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

export interface FetchReposOptions {
  user: string;
  /** Optional token; raises the rate limit. Server-side only, never sent to the browser. */
  token?: string | undefined;
  /** Injected for tests and for Next's cache options. */
  fetch?: typeof fetch;
  /** Extra RequestInit merged into every request (e.g. `{ next: { revalidate } }`). */
  init?: RequestInit & Record<string, unknown>;
  perPage?: number;
  /** Upper bound on pages, so a pagination bug can never loop forever. */
  maxPages?: number;
  timeoutMs?: number;
  /** Retries for network errors and 5xx responses (not for 4xx or rate limits). */
  retries?: number;
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Every public repository owned by `user`, following pagination. Private
 * repositories are dropped even if the token could see them. Failures are
 * returned, not thrown: callers render their own content without GitHub.
 */
export async function fetchPublicRepos(options: FetchReposOptions): Promise<ReposResult> {
  const { user, token, perPage = 100, maxPages = 10, timeoutMs = 8000, retries = 2 } = options;
  const doFetch = options.fetch ?? fetch;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "v1cferr.dev",
  };
  if (token !== undefined && token !== "") headers.Authorization = `Bearer ${token}`;

  const repos: GitHubRepo[] = [];
  let url: string | undefined =
    `https://api.github.com/users/${encodeURIComponent(user)}/repos?type=owner&sort=pushed&per_page=${String(perPage)}`;

  for (let page = 0; url !== undefined; page++) {
    if (page >= maxPages) return { ok: false, error: `stopped after ${String(maxPages)} pages` };

    let response: Response | undefined;
    for (let attempt = 0; ; attempt++) {
      try {
        response = await doFetch(url, { ...options.init, headers, signal: AbortSignal.timeout(timeoutMs) });
        if (response.status < 500 || attempt >= retries) break;
      } catch (error) {
        if (attempt >= retries) return { ok: false, error: `request failed: ${(error as Error).message}` };
      }
      await sleep(250 * 2 ** attempt);
    }

    if (!response.ok) {
      const limited = response.headers.get("x-ratelimit-remaining") === "0";
      return { ok: false, status: response.status, error: limited ? "rate limited" : `GitHub answered ${String(response.status)}` };
    }

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
