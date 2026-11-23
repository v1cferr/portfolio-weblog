# Architecture decision records

Each record keeps the context, the decision and its trade-offs. Records are not
rewritten when a decision changes; a new record supersedes the old one and says
so.

| ADR                                                     | Decision                                             | Status                    |
| ------------------------------------------------------- | ---------------------------------------------------- | ------------------------- |
| [0001](0001-content-first.md)                           | Structured content in Git is the source of truth     | Accepted                  |
| [0002](0002-nextjs-as-backend.md)                       | Next.js is the only backend for now                  | Accepted                  |
| [0003](0003-pnpm-workspaces-without-turborepo.md)       | pnpm workspaces, no Turborepo                        | Accepted                  |
| [0004](0004-drop-supabase-and-personal-integrations.md) | Supabase and personal integrations stay in v1        | Partly superseded by 0008 |
| [0005](0005-toolchain-versions.md)                      | TypeScript 6.0 and ESLint 10                         | Accepted                  |
| [0006](0006-local-search-before-ai.md)                  | Local text search before any AI layer                | Accepted                  |
| [0007](0007-visual-system.md)                           | Tokyo Night, clear glass, lane backdrop              | Accepted                  |
| [0008](0008-spotify-now-playing.md)                     | Spotify "now playing" returns, on the server's terms | Accepted                  |
| [0009](0009-security-headers.md)                        | Security headers with a static CSP                   | Accepted                  |
| [0010](0010-security-pipeline.md)                       | A security pipeline in CI                            | Accepted                  |
| [0012](0012-dated-content-folders.md)                   | Weblog posts in dated folders, with unchanged URLs   | Accepted                  |
| [0013](0013-now-and-next.md)                            | A dated now log and next plans, partly derived       | Accepted                  |
| [0014](0014-project-case-studies.md)                    | Project case studies in two layers                   | Accepted                  |
