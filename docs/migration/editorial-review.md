# Editorial review before v2 goes public

v2 only reaches production after the author approves the merge. Until then,
these items need a decision. Nothing in this list is rendered publicly unless
noted as "published".

## Facts that are missing (not rendered)

- Undergraduate degree: v1's menu mentions "Graduação em GTI", and the author
  graduated in 2026, but the institution and the dates are not recorded, so no
  education entry exists yet.
- Start dates and completion of the ONE program and the New Rizon bootcamp
  (published without dates).

## Drafted on request (published on the v2 preview)

- `content/experiences/fai-ufscar-2026.yaml`, position "AI systems analyst": its
  five responsibilities were drafted from the usual scope of the role (public
  job postings) and limited to what overlaps with the work in the author's
  LinkedIn description. Confirm or edit them; they describe the role, not
  verified outcomes.

## Claims kept out of public pages (`pendingReview` fields)

The v1 career timeline included impact metrics that cannot be checked against
any source. They live in `pendingReview` on each experience (Amcor, Cultura
Inglesa, Xmart Solutions). To publish one, move it into `contributions` with its
evidence. The freelance experience has no clients or projects listed yet.

## Text written during the migration (published on the v2 preview)

These were written from the author's own notes and need the author's reading
before the merge:

- Portuguese versions of the FAI.UFSCar titles, note and responsibilities (the
  source was English).
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
