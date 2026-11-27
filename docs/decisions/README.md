# Architecture decision records

Each record keeps the context, the decision and its trade-offs. Records are not
rewritten when a decision changes; a new record supersedes the old one and says
so.

The records are also published as the site's decision log, at
[v1cferr.dev/en-us/decisions](https://v1cferr.dev/en-us/decisions), rendered
from these files as they are. A new record needs a plain-language summary in
`content/decisions.yaml` (en-us and pt-br), or `pnpm content:check` fails.

| ADR                                                     | Decision                                                    | Status                          |
| ------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| [0001](0001-content-first.md)                           | Structured content in Git is the source of truth            | Accepted                        |
| [0002](0002-nextjs-as-backend.md)                       | Next.js is the only backend for now                         | Accepted                        |
| [0003](0003-pnpm-workspaces-without-turborepo.md)       | pnpm workspaces, no Turborepo                               | Accepted                        |
| [0004](0004-drop-supabase-and-personal-integrations.md) | Supabase and personal integrations stay in v1               | Partly superseded by 0008, 0015 |
| [0005](0005-toolchain-versions.md)                      | TypeScript 6.0 and ESLint 10                                | Accepted                        |
| [0006](0006-local-search-before-ai.md)                  | Local text search before any AI layer                       | Accepted                        |
| [0007](0007-visual-system.md)                           | Graphite + sage (was Tokyo Night), glass, dot grid          | Type superseded by 0016         |
| [0008](0008-spotify-now-playing.md)                     | Spotify "now playing" returns, on the server's terms        | Accepted                        |
| [0009](0009-security-headers.md)                        | Security headers with a static CSP                          | Accepted                        |
| [0010](0010-security-pipeline.md)                       | A security pipeline in CI                                   | Accepted                        |
| [0011](0011-profile-chat.md)                            | A profile chat that answers only from the site's pages      | Accepted, revised 2026-11-26    |
| [0012](0012-dated-content-folders.md)                   | Weblog posts in dated folders, with unchanged URLs          | Accepted                        |
| [0013](0013-now-and-next.md)                            | A dated now log and next plans, partly derived              | Accepted                        |
| [0014](0014-project-case-studies.md)                    | Project case studies in two layers                          | Accepted                        |
| [0015](0015-world-of-warcraft-returns.md)               | World of Warcraft returns (server-only, client credentials) | Accepted                        |
| [0016](0016-geist-type.md)                              | Geist and Geist Mono for the whole site                     | Accepted                        |
| [0017](0017-live-github-data-on-project-pages.md)       | Live GitHub data (languages) on project pages               | Accepted                        |
| [0018](0018-per-tab-ui-state.md)                        | UI state kept per tab, without a state library              | Accepted                        |
