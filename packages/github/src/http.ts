/** What every request to the GitHub REST API accepts. */
export interface GitHubRequestOptions {
  /** Optional token; raises the rate limit. Server-side only, never sent to the browser. */
  token?: string | undefined;
  /** Injected for tests and for Next's cache options. */
  fetch?: typeof fetch;
  /** Extra RequestInit merged into every request (e.g. `{ next: { revalidate } }`). */
  init?: RequestInit & Record<string, unknown>;
  timeoutMs?: number;
  /** Retries for network errors and 5xx responses (not for 4xx or rate limits). */
  retries?: number;
}

export type GitHubResponse = { ok: true; response: Response } | { ok: false; error: string; status?: number };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function githubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "v1cferr.dev",
  };
  if (token !== undefined && token !== "") headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * One GET to the API, retried on network errors and 5xx with a short backoff.
 * A non-2xx answer comes back as `ok: false` with its status, never thrown.
 */
export async function githubGet(url: string, options: GitHubRequestOptions): Promise<GitHubResponse> {
  const { token, timeoutMs = 8000, retries = 2 } = options;
  const doFetch = options.fetch ?? fetch;
  const headers = githubHeaders(token);

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
  return { ok: true, response };
}

/**
 * Runs at most `limit` tasks at once; the rest wait in order. Keeps a burst of
 * project pages from opening dozens of connections to the API at the same time.
 */
export function createLimiter(limit: number): <T>(task: () => Promise<T>) => Promise<T> {
  let active = 0;
  const queue: (() => void)[] = [];
  // A finished task hands its slot straight to the next waiter, so a newcomer can never slip in between.
  const next = () => {
    const waiter = queue.shift();
    if (waiter !== undefined) waiter();
    else active--;
  };
  return async <T>(task: () => Promise<T>) => {
    if (active >= limit) await new Promise<void>((resolve) => queue.push(resolve));
    else active++;
    try {
      return await task();
    } finally {
      next();
    }
  };
}
