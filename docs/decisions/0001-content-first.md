# 0001. Structured content in Git is the source of truth

- Status: accepted (2026-10-09)
- Jira: PWL-97, PWL-99, PWL-100

## Context

v1 kept career data, projects and personal details inside React components and
`src/data/*.ts`. Every change of content was a code change, five of six projects
were placeholders, and nothing validated what the site claimed. The hub is meant
to last many years and several careers; the framework that renders it will
change long before the content stops mattering.

## Decision

- `content/` holds every fact the site states, as YAML (entities) and MDX
  (articles).
- `packages/content` owns the schemas (Zod), loading, cross-file validation, the
  public registry and derived timelines. The app reads content only through it.
- Every entity has a stable id, an editorial status (`draft`, `review`,
  `published`) and a visibility (`public`, `private`). Only `published` +
  `public` content reaches any public output.
- Relations are declared in content and validated in CI. No graph database.
- Dates keep only their known precision (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`).

## Consequences

- Content survives a framework change; a new renderer only needs the registry or
  the files.
- Adding a fact means editing a file and passing `pnpm content:check`, not
  writing JSX.
- Claims that cannot be verified have a place (`pendingReview`) that is never
  rendered, which keeps them out of the site without losing them.
- The registry is built in memory at build time. That is fine for hundreds of
  entities; tens of thousands would need an index, which is not a foreseeable
  need for a personal hub.
