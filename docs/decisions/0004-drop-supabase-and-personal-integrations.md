# 0004. Supabase and personal integrations stay in v1

- Status: accepted (2026-10-09, decided with the owner)
- Jira: PWL-98, PWL-32

## Context

v1 used Supabase for a single table (`blizzard_tokens`) behind a World of
Warcraft page, plus Spotify "now playing", a Google Sheets-backed VS Code page
and two Deno edge functions. They required six secrets, OAuth callbacks (one
returned raw tokens to the caller) and Deno tooling. None of them holds content
the hub needs to keep. An older plan (PWL-32) considered Supabase pgvector as a
data lake for an AI chatbot.

## Decision

None of these integrations is rebuilt in v2. They remain runnable from
`archive/pre-v2-2026-10-09`. Old routes redirect permanently to the closest v2
page. The Nix shell drops `deno` and `supabase-cli`.

No database is introduced: content is versioned in Git, and a database would
duplicate it.

## When to revisit

A database is justified only by a demonstrated need the files cannot meet, such
as user-generated data or a vector index too large to rebuild at deploy time
(ADR 0006). The PWL-32 idea is kept as a record in Jira, not carried forward as
a plan.
