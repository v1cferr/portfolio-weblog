# How timelines are derived

Timelines are computed from content in `packages/content/src/timeline`; nothing
is written by hand.

| Event         | Comes from                                               | Lane    |
| ------------- | -------------------------------------------------------- | ------- |
| Position      | each `positions[]` entry with a `start`                  | career  |
| Project       | `startedAt`, or the repository creation date (see below) | project |
| Education     | `start` (entries without dates are not placed)           | study   |
| Certification | `issuedAt`                                               | study   |
| Post          | `publishedAt`                                            | writing |

- Sorting is newest first by the earliest day a partial date can mean; ties
  break by key.
- **Career timeline** (`getCareerTimeline`): positions only.
- **Unified timeline** (`getUnifiedTimeline`): everything above. It accepts an
  enrichment function; the web app passes GitHub's `created_at` for the
  project's repository. Such events have `dateSource: "repository-created"` and
  are drawn as hollow nodes labelled "repository created", because creating a
  repository is not the start of a project.
- A project without `startedAt` and without a public repository is not placed on
  the timeline.
- `pushed_at` is never used as an editorial state: a quiet repository is not an
  abandoned project.
