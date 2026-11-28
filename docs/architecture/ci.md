# Continuous integration

`.github/workflows/ci.yml` runs on every pull request and push to `main`. Its
single status is **Validate and build** (the `ci-ok` job). A pull request is
merged only when it is green.

## Jobs

| Job                            | What it does                                                                                  | When                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `changes`                      | Lists the changed files and decides whether the site needs to be built and tested             | Always                                      |
| `checks`                       | Format, lint, typecheck, content integrity, icons, knip and unit tests                        | Always                                      |
| `e2e` (4 shards)               | Production build, then a quarter of the Playwright suite (`--shard=<n>/4`) on phone + desktop | When anything besides documentation changed |
| `e2e-report`                   | Merges the shards' blob reports into one HTML report and uploads it                           | When a shard failed                         |
| `ci-ok` ("Validate and build") | Passes when `checks` passed and `e2e` passed or was skipped on purpose                        | Always                                      |

`checks` and the shards run at the same time. Before 2026-11-28 everything ran
in one job, in order, in about 13 minutes, 9 of them end-to-end tests.

## Skipped for documentation

`e2e` is skipped when every changed file is one the site never reads: `docs/`,
`AGENTS.md`, `CLAUDE.md`, `README.md`, `LICENSE` and `scripts/ci-watch.sh`.
`checks` still runs, so Markdown formatting is checked. When there is no base to
compare with (a new branch pushed straight to `main`), everything runs.

## Caches

- pnpm's store, through `actions/setup-node`.
- `apps/web/.next/cache`, so a build reuses what an earlier one compiled. The
  key changes with the sources; the newest cache for the same lockfile is the
  fallback.
- Playwright's Chromium, keyed on the lockfile (which pins the version). On a
  hit only its system libraries are installed.

## A failure

- The failing job's log names the test. When a shard fails, the
  `playwright-report` artifact of the run has the merged HTML report with
  traces.
- "Re-run failed jobs" on the run reruns only the shard that failed.
- `scripts/ci-watch.sh <run-id | branch>` streams a run's progress: a 0-100%
  bar, the step in progress, the ETA of the slowest job and every failing step.
