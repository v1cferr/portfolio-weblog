# Architecture decision records

Each record keeps the context, the decision and its trade-offs. Records are not
rewritten when a decision changes; a new record supersedes the old one and says
so.

| ADR                                                     | Decision                                         | Status   |
| ------------------------------------------------------- | ------------------------------------------------ | -------- |
| [0001](0001-content-first.md)                           | Structured content in Git is the source of truth | Accepted |
| [0002](0002-nextjs-as-backend.md)                       | Next.js is the only backend for now              | Accepted |
| [0003](0003-pnpm-workspaces-without-turborepo.md)       | pnpm workspaces, no Turborepo                    | Accepted |
| [0004](0004-drop-supabase-and-personal-integrations.md) | Supabase and personal integrations stay in v1    | Accepted |
| [0005](0005-toolchain-versions.md)                      | TypeScript 6.0 and ESLint 10                     | Accepted |
| [0006](0006-local-search-before-ai.md)                  | Local text search before any AI layer            | Accepted |
