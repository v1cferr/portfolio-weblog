# GitHub integration

`packages/github` → `fetchPublicRepos({ user, token?, ... })`:

- `GET /users/{user}/repos?type=owner&per_page=100`, following
  `Link: rel="next"` up to a page cap.
- Keeps a repository only if `private` is false and `visibility` is `public`.
- 8 s timeout per request; retries network errors and 5xx with backoff; no retry
  on 4xx or rate limiting; returns `{ ok: false, error }` instead of throwing.
- Each item is validated; malformed items are skipped.

`apps/web/src/lib/github.ts` calls it once per render (React `cache`) with
`next: { revalidate: 86400, tags: ["github"] }`. Set `GITHUB_TOKEN` (no scopes
needed) to raise the rate limit; without it the unauthenticated limit is enough
for a daily refresh.

What GitHub may show: language, repository creation date, last push, the
repository link and the list of public repositories that the content does not
curate. What it may **not** decide: whether a project is featured, its state,
category, summary, learnings or relations; those live in
`content/projects/*.yaml`.

If GitHub is unreachable, pages render from content alone and project pages say
so.
