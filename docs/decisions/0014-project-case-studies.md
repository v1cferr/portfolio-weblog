# 0014. Project case studies

- Status: accepted (2026-11-23, decided with the owner)

## Context

A project page said what a project is, not why it exists or what it cost to
build. The owner wanted the flagship projects told as case studies, in a format
a reader can stop reading at any point: a short layer on the first screen and a
deep dive below. Every claim still has to come from the repositories or from the
owner (ADR 0001), and an outcome nobody stated must not be guessed.

## Decision

- **Schema.** `Project` gains an optional `caseStudy` in `packages/content`,
  localized like every other text field. Only `problem`, `role` and one to three
  `decisions` are required. A decision is "chose X over Y because…, cost: …",
  with the ADR that records it. `outcome`, `motivation`, `constraints`,
  `nonGoals`, `approach`, `quality`, `howBuilt`, `lessons`, `next` and the
  `adrs` link are optional. URLs are validated.
- **Two layers.** The project page opens with a TL;DR card (problem, outcome
  when there is one, role, dates, stack, links including the ADRs), then the
  deep dive in a fixed order: motivation, constraints and non-goals, approach,
  decisions, how it was built with the quality gates, lessons, next. Decisions
  are `<details>` cards with the first one open. A section renders only when its
  data exists, so an empty field leaves no heading.
- **Lists.** Featured projects show the problem under their title and a "Case
  study" badge when they have one.
- **Flagships.** dotfiles, portfolio-weblog and imobos are featured and get case
  studies. obsidian-rag stays listed but is no longer featured. acuttis-point is
  now private.
- **Drafts.** Each case study carries a YAML comment saying it was drafted from
  repository facts and waits for the owner's review. Outcomes and lessons stay
  empty until the owner gives them. A real client stays unnamed.

## Consequences

- Without a case study, a project page is unchanged.
- The TL;DR carries the dates and links, so on a case study page the side column
  keeps only what GitHub adds (language, creation, last push).
- The word budget (about 150 words up top, 400 to 800 below) is editorial and is
  not enforced by the schema.
- A case study is only as current as its last review; the ADR links keep each
  decision traceable to its source.
