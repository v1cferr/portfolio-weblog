# Content model

Schemas live in `packages/content/src/schemas`. Objects are strict: an unknown
or misspelled field fails validation instead of being silently dropped.

| Entity         | Location                                         | Notes                                                      |
| -------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| Profile        | `content/profile/profile.yaml`                   | headline, summary, about, focus, links, quotes, trajectory |
| Setup          | `content/profile/setup.yaml`                     | workstation groups; outside the graph                      |
| Organization   | `content/taxonomies/organizations.yaml`          | companies, schools, programs, platforms                    |
| Technology     | `content/taxonomies/technologies.yaml`           | name, category, URL                                        |
| Skill          | `content/taxonomies/skills.yaml`                 | broader capabilities, linked to technologies               |
| Experience     | `content/experiences/<id>.yaml`                  | one organization, one or more positions                    |
| Project        | `content/projects/<id>.yaml`                     | curated metadata + optional `owner/name` repository        |
| Education      | `content/education/<id>.yaml`                    | course, program, degree...                                 |
| Certification  | `content/education/certifications/<id>.yaml`     | issuer, issue date, credential URL                         |
| WeblogPost     | `content/weblog/<YYYY>/<MM>/<slug>/<locale>.mdx` | one file per translation; folder = month of `publishedAt`  |
| Page           | `content/pages/<slug>/<locale>.mdx`              | standalone prose; outside the graph                        |
| Recommendation | `content/recommendations/<id>.yaml`              | someone else's words, verbatim; outside the graph          |

## Common fields

- `id`: lowercase kebab-case, unique **across all types**, equal to the file
  name, never changed once published (URLs use it).
- `status`: `draft` | `review` | `published` (default `published`).
- `visibility`: `public` | `private` (default `public`).
- `pendingReview`: claims kept for the editor, never rendered (see
  [visibility](visibility.md)).
- Localized text: `{ en-us?, pt-br?, zh-cn? }`, at least one locale. Lists use
  the same shape with arrays.
- Media (experiences, projects, studies):
  `media: [{ src, width, height, alt, caption? }]` with `src` under
  `apps/web/public` and its intrinsic size in pixels; an entry without photos
  shows no gallery. See [add photos](../guides/add-media.md).
- Dates: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. Unquoted values are fine; use only
  the precision you actually know.

## Recommendations

What other people wrote about the owner, published with their permission. The
text in `language` (the one they wrote in) is verbatim, typos included; other
locales are translations, and pages label them as such. `excerpt` quotes the
text: pieces joined by "…" where something was cut, each one checked word for
word against the same locale's text. `featured: <n>` puts one on the home page,
in that order. `relation` names the organization (its logo is shown) and, when
the site has them, the shared job (`experience`) or course (`education`); its
`label` is the relation in the owner's words. `photo` is optional, a file under
`apps/web/public/recommendations/`; without it the card shows initials.

## Relations

Declared on one side and indexed in both directions by the registry:

| From          | Field                                                | To                                       |
| ------------- | ---------------------------------------------------- | ---------------------------------------- |
| Experience    | `organization`, `technologies`, `skills`, `projects` | Organization, Technology, Skill, Project |
| Project       | `technologies`, `skills`, `experiences`              | Technology, Skill, Experience            |
| Education     | `institution`, `technologies`, `projects`            | Organization, Technology, Project        |
| Certification | `issuer`, `technologies`                             | Organization, Technology                 |
| WeblogPost    | `projects`, `experiences`, `technologies`            | Project, Experience, Technology          |
| Skill         | `technologies`                                       | Technology                               |
| Profile       | `trajectory[].ref`                                   | any entity                               |

`pnpm content:check` fails on: images that are missing or still carry
EXIF/XMP/IPTC metadata, schema errors, duplicate ids, id/file-name mismatch,
references to missing entities or to the wrong type, end dates before start
dates, published experiences without start dates, published posts without
`publishedAt`, translations that disagree on visibility, public content
referencing private content, and recommendation excerpts that are not word for
word in their text. References from public content to entries still in review
only warn; the registry hides them.

## Registry API (`@workspace/content`)

`loadRegistry(root)` returns the public view: `getProfile`, `getExperiences`,
`getExperience`, `getProjects`, `getProject`, `getEducation`,
`getCertifications`, `getRecommendations`, `getPosts(locale)`,
`getPost(slug, locale)`, `getCareerTimeline`, `getUnifiedTimeline(enrichment?)`,
`getRelatedContent(id)`, `getSourceFile(id)`, plus taxonomy getters.
`{ includeUnpublished: true }` exists for tooling only.
