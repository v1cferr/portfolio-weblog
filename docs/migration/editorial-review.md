# Editorial review before v2 goes public

v2 only reaches production after the author approves the merge. Until then,
these items need a decision. Nothing in this list is rendered publicly unless
noted as "published".

## Facts that are missing (content in `review`, not rendered)

- `content/experiences/freelance-2024.yaml`: the v1 "Software-AI Developer,
  Freelance, Apr 2024 – present" entry. Confirm it, describe it, or delete it.
- Undergraduate degree: v1's menu mentions "Graduação em GTI" with no
  institution or dates, so no education entry exists for it yet.
- Start dates and completion of the ONE program and the New Rizon bootcamp
  (published without dates).

## Published with partial information

- `content/experiences/fai-ufscar-2026.yaml` (published 2026-10-10 from the
  author's LinkedIn entry): the role description was cut off in the screenshot,
  so responsibilities, contributions and learnings are empty, and only the
  AI/LLM skill is linked. Paste the full description and the "+10 skills" to
  complete it.

## Claims kept out of public pages (`pendingReview` fields)

The v1 career timeline included impact metrics that cannot be checked against
any source. They live in `pendingReview` on each experience (Amcor, Cultura
Inglesa, Xmart Solutions). To publish one, move it into `contributions` with its
evidence.

## Text written during the migration (published on the v2 preview)

These were written from the author's own notes and need the author's reading
before the merge:

- English versions of everything that only existed in Portuguese: career entries
  (v1 timeline and Jira PWL-33), project summaries from Portuguese repository
  descriptions, the profile headline.
- The profile `about` paragraphs, assembled from the PWL-101 trajectory and the
  PWL-33 learnings.
- The Xmart Solutions `context` paragraph describing XGuardian.
- Project `state` values (active, experimental, historical...). They were set
  from public repository activity as a starting point; PWL-102 says they are an
  editorial choice.
- The setup page stays in Portuguese only, as written in v1.

No Chinese (zh-cn) editorial content was written: zh-cn pages show the English
text with a notice.

## Links not verified from the build machine

- `https://www.fai.ufscar.br/` did not answer from the machine that ran the
  migration (2026-10-09).
- `https://ap.v1cferr.dev` answered 404, so `ufscar-housing-radar` has no
  website link.
