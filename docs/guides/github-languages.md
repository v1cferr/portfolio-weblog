# Repository languages from GitHub

A project with `repository:` in its YAML shows the languages of that repository
the way GitHub lists them: a stacked bar and a legend on the project page
(anchor `#languages`), and a thin bar along the bottom of its card's cover. No
one types them: they follow the repository as it changes. The decision is
[ADR 0017](../decisions/0017-live-github-data-on-project-pages.md).

## Where the numbers come from

| Piece                                  | What it does                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/github` `fetchRepoLanguages` | `GET /repos/{owner}/{repo}/languages` (bytes per language), validated with zod     |
| `packages/github` `languageShares`     | bytes → % of the total, one decimal, largest first; under 1% gathered into "Other" |
| `apps/web/src/lib/github.ts`           | `getRepoLanguages(fullName)`: index check, cache, colours, failures                |
| `src/generated/linguist-colors.json`   | GitHub's language colours, vendored from github-linguist (MIT)                     |
| `features/projects/repo-languages.tsx` | the project page block: bar, legend, "i", archived badge                           |
| `features/projects/languages.tsx`      | the bar itself, shared with the card                                               |

Only a repository the public index lists (`getRepoIndex`, the owner's public
repositories) is asked for its languages. A private, deleted or renamed
repository, or one with no code, has no block and no bar; nothing says so on the
page. One language under 1% keeps its name; two or more are gathered into
"Outros / Other".

The index also brings the repository's `archived`, `pushed_at` and `html_url`:
an archived repository gets an "Arquivado / Archived" badge in the block. The
REST API does not say when a repository was archived, so the badge has no date.

## Caching and refresh

Every request goes through Next's data cache with
`next: { revalidate: GITHUB_REVALIDATE_SECONDS, tags: ["github"] }`, one day,
the same as the pages (`revalidate = 86400`, ISR). So:

- A build asks GitHub once per repository; every page and locale that shows it
  reuses the cached answer (React `cache` within a render, the data cache across
  them).
- At most four requests run at once (`createLimiter(4)`).
- A day later, the next visit regenerates the page in the background with fresh
  numbers. The "i" says when GitHub produced them (its `Date` header).
- To refresh at once, purge the `github` tag (Vercel's cache invalidation by
  tag) or redeploy.

Requests carry `GITHUB_TOKEN` when the server has one (5,000 requests an hour
instead of 60). A read-only token with no scopes is enough, since the
repositories are public. Without it the site still works: a build makes about
fifteen requests.

## Failures

The page never breaks because of GitHub. A timeout, a 5xx after two retries, a
rate limit or a malformed answer leaves the project without the block and logs
one warning per distinct error. A 404 is not logged: it means the repository
went private or away.

## Tests and CI

The e2e suite never calls GitHub. A build made with `GITHUB_FIXTURES=1` reads
the snapshot in `apps/web/src/lib/github-fixture.ts` instead (in it,
`acuttis-point` is private and `encriptador-descriptador` archived). CI sets the
flag for the build and the e2e run; locally:

```sh
GITHUB_FIXTURES=1 pnpm build
cd apps/web && GITHUB_FIXTURES=1 E2E_PORT=3313 pnpm exec playwright test
```

Without the flag, `e2e/repo-languages.spec.ts` skips itself.

## Refresh the colours

```sh
pnpm --filter web linguist:colors          # the pinned linguist release
pnpm --filter web linguist:colors v9.8.0   # another release
```

The script keeps every language that has a colour, so a new language in a
repository is coloured without a code change; one linguist has no colour for is
drawn in GitHub's neutral grey.
