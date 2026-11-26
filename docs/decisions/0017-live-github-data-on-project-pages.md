# 0017. Live GitHub data on project pages

- Status: accepted (2026-11-26, asked for by the owner)

## Context

Project pages already read a little from GitHub: the owner's public
repositories, once a day, for the repository link, its creation date and its
last push (ADR 0001 keeps GitHub as enrichment, never the source of truth). The
owner wants each project's languages too, as GitHub lists them, and does not
want to type them: repositories are created, archived, deleted and rewritten,
and a hand-kept list would drift from the code.

The `technologies` in the content are a different thing: an editorial choice of
what the project is about, linked to the catalogue's filters. Languages are a
measurement.

## Decision

- **Languages come from GitHub at render time**, from
  `GET /repos/{owner}/{repo}/languages`, on the server only. Bytes become shares
  of the total with one decimal; languages under 1% are gathered into "Other",
  the way GitHub draws its bar.
- **Only public repositories.** A project is asked about only when the public
  index lists its repository; a private, deleted or renamed one shows nothing,
  silently.
- **The same cache as the rest of GitHub's data**: Next's data cache with a
  one-day revalidation and the `github` tag, ISR pages regenerated daily, at
  most four requests at once, `GITHUB_TOKEN` when the server has it.
- **GitHub's colours, vendored.** The linguist colour map is committed, made by
  a script from a pinned github-linguist release (MIT); the site never asks a
  third party at runtime.
- **GitHub never breaks a page.** Any failure leaves the project without the
  block and logs one warning.
- **Tests do not touch the network.** Builds made with `GITHUB_FIXTURES=1` (CI)
  read a committed snapshot.

## Consequences

- Languages can be a day old. A purge of the `github` tag or a deploy refreshes
  them at once.
- Without `GITHUB_TOKEN` in Production, the server shares GitHub's 60 requests
  an hour per IP. A build makes about fifteen; a token (no scopes needed) gives
  5,000.
- CI no longer exercises the live GitHub API; the unit tests cover the client,
  and the snapshot covers the pages.
- The REST API does not say when a repository was archived, so the "Archived"
  badge has no date.
- See [the guide](../guides/github-languages.md) for how it works and how to
  refresh it.
