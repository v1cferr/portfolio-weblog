# Working on this repository

How an AI agent (Claude Code or another) works in this repository. Architecture
lives in [docs/architecture](docs/architecture), decisions in
[docs/decisions](docs/decisions), how-tos in [docs/guides](docs/guides), and the
Next.js notes in [apps/web/AGENTS.md](apps/web/AGENTS.md).

## Keep the owner informed: what is missing, what could be better

At the start of every session and when wrapping up each delivery, tell the owner
what is still missing and suggest what to do next. The owner picks; nothing on
the list is implemented until they do.

Cross these sources:

1. The open issues of the Jira project `PWL` (the owner's backlog).
2. The owner's local notes in `docs/tmp/` (gitignored, never committed):
   `anotacoes.md` (rules, "Onde paramos" and the to-do list), `pendencias.md`
   (what waits on the owner) and `feitos.md` (what is done).
3. Current best practices, researched on the web, compared with what the
   repository does today.
4. An audit of the project itself: UI/UX, accessibility, performance, SEO,
   content gaps, tests and security.

Answer with a short, prioritized list in three parts: what waits on the owner
(data or decisions), what the agent can do alone, and suggested improvements,
with one option marked as recommended. Afterwards, update "Onde paramos" in
`docs/tmp/anotacoes.md`.

## Working agreements

- One worktree and one branch per change; never commit on `main`.
- Atomic commits in English, following Conventional Commits. No `Co-Authored-By`
  trailer.
- Merge a pull request only when every CI check is green.
- While CI runs, show its progress live in the session with
  `scripts/ci-watch.sh <run-id | branch>`: a 0-100% bar, the step in progress,
  an ETA from the median of recent green runs, any step that fails, and the
  conclusion. Never wait silently for the end.
- Everything in the repository is in English (en-US); the site's copy is in the
  owner's first person.
- Mobile-first, shadcn/ui components from `packages/ui`, official logos, a
  stable `#id` for every shareable element.
- Never invent facts about the owner; content comes from `content/` and its
  sources. Photos go through `pnpm media:add` (it strips metadata), and the
  owner's family never appears on the site.
- Secrets never go in the repository, a log or a chat; production secrets only
  with the owner's explicit approval.
