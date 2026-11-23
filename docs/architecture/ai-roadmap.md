# Path to retrieval and a profile chat

Search came first (ADR 0006): `buildSearchDocuments(registry, locale)` produces
public, normalized documents with `entityId`, `type`, `locale`, `section`,
`title`, `keywords`, `text` and `url`. The profile chat is built on them (ADR
0011).

| Step       | Plan                                                                              | Status                                                                                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corpus     | Reuse those documents; chunk long fields by heading, keeping document id and URL. | Done: `buildRetrievalPassages` (About page, entities with prose, posts split by heading).                                                                                                         |
| Retrieval  | Hybrid (MiniSearch keyword + vector similarity), filtered by locale.              | Keyword only, on the server (`createRetriever`). Embeddings deferred: no free, stable embeddings endpoint to depend on yet.                                                                       |
| Generation | The model answers only from retrieved chunks and cites them by URL.               | Done: free models via OpenRouter, strict JSON with passage ids per sentence; the server drops uncited, out-of-range or unfaithful sentences and maps ids to URLs. No retrieved source, no answer. |
| Evals      | A fixed set of questions with expected sources, run in CI.                        | Done: `apps/web/evals/profile-chat.yaml`; retrieval and faithfulness run in `pnpm test`, the model checks with `eval:chat` and an OpenRouter key.                                                 |

Next, when the eval set shows misses that keywords cannot fix: embeddings
computed at build time or in an `apps/ai` job (ADR 0002) from the public corpus
only. A few hundred chunks fit in a file next to the build output; a vector
store is only needed beyond that.

Rules that do not change: private and unpublished content never enters the
corpus; the model is a query interface, never a source of facts.
