# 0002. Next.js is the only backend for now

- Status: accepted (2026-10-09)
- Jira: PWL-99, PWL-105

## Context

The hub needs to read local content, fetch public GitHub metadata, serve RSS and
a search index. A separate API (FastAPI, NestJS, Express) would add a
deployment, a network hop and a second language runtime without a requirement
that needs one.

## Decision

The app is a modular full-stack monolith on Next.js:

- React Server Components read content and call server-only modules directly
  (`src/lib/*`). There is no internal HTTP API between a page and its own data.
- Route handlers exist only for outputs that must be HTTP resources: the
  per-locale search index (`/api/search/[locale]`) and RSS
  (`/[locale]/weblog/rss.xml`). Both are statically generated.
- External data (GitHub) is fetched server-side with `next.revalidate`; pages
  that use it are regenerated at most daily.
- No Server Actions, no database and no authentication: nothing mutates state at
  runtime.

## When to revisit

Create `apps/ai` (FastAPI + uv) when a concrete need appears that does not fit
here: Python pipelines (ingestion, chunking, embeddings), long-running jobs,
workers, evals or local inference. It would consume the same public document
corpus (see ADR 0006) and must never become the source of truth.
