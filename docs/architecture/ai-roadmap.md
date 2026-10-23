# Path to retrieval and a profile chat

What exists now (ADR 0006): `buildSearchDocuments(registry, locale)` produces
public, normalized documents with `entityId`, `type`, `locale`, `section`,
`title`, `keywords`, `text` and `url`.

Steps to add AI later, without changing the source of truth:

1. **Corpus**: reuse those documents. Chunk long fields (article bodies) by
   heading; keep the document id and URL on every chunk.
2. **Embeddings**: computed at build time or in an `apps/ai` job (ADR 0002) from
   the public corpus only. A few hundred chunks fit in a file next to the build
   output; a vector store is only needed beyond that.
3. **Retrieval**: hybrid (MiniSearch keyword + vector similarity), filtered by
   locale.
4. **Generation**: the model answers only from retrieved chunks and must cite
   them by URL. No retrieved source, no answer.
5. **Evals**: a fixed set of questions (e.g. those in PWL-105) with expected
   sources, run in CI.

Rules that do not change: private and unpublished content never enters the
corpus; the model is a query interface, never a source of facts.
