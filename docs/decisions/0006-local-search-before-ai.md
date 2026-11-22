# 0006. Local text search before any AI layer

- Status: accepted (2026-10-09)
- Jira: PWL-105, PWL-32

## Context

PWL-105 asks for search now and, later, a "profile chat" that answers questions
with sources. The model must never be the source of truth.

## Decision

- `packages/search` builds normalized documents from the **public** registry
  only. Each document carries its entity id and type, the locale its text is
  written in, the site section and the URL of the page that shows it.
- The app serves one static JSON corpus per locale; the browser indexes it with
  MiniSearch when the search dialog first opens. No server, vector store or
  model at runtime.
- The same documents are the future retrieval corpus (see
  `docs/architecture/ai-roadmap.md`).

## Consequences

- Search works offline from the build output and cannot leak unpublished
  content.
- The corpus is small (tens of KB). Client-side indexing is fine until it
  reaches a few MB.
