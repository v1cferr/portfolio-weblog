# 0010. A security pipeline in CI

- Status: accepted (2026-11-22, decided with the owner)

## Context

The 2026-11-22 security review (ADR 0009) asked for automated vulnerability
checks. Until then CI validated and built the site, Dependabot opened update
PRs, and GitGuardian scanned for secrets, but nothing failed on a known
advisory, and the workflows referenced actions by mutable tags.

## Decision

- **Dependency audit** (`security.yml`):
  `pnpm audit --prod --audit-level moderate` on every pull request, every push
  to `main` and weekly. Only production dependencies count; dev tooling never
  reaches the server or the browser. A fix that a parent package does not pull
  in yet goes in `overrides` (`pnpm-workspace.yaml`), with a note on when to
  remove it.
- **zizmor** (`security.yml`) lints the workflows for injection, excessive
  permissions, persisted credentials and unpinned actions.
- **CodeQL** (`codeql.yml`), `security-extended` queries for TypeScript and for
  the workflows themselves, with results in the repository's code scanning.
- **Actions pinned to commit SHAs**, with the version in a comment, and
  checkouts without persisted credentials. Workflows start from
  `permissions: {}` and each job asks for what it needs.
- **Dependabot** waits 3 days after a release (7 for majors) before opening a
  PR; security updates skip the wait. Actions update weekly, grouped.
  `@types/node` stays on the Node major the project runs.
- Secrets scanning stays with GitGuardian, already on the repository.

## Consequences

- A new moderate-or-worse advisory in a production dependency fails the Security
  workflow on the next PR or weekly run, even with no code change.
- Dependabot PRs are still merged by hand. Auto-merge would need a required
  status check on `main`, which would also block direct pushes; revisit if the
  manual merges become a chore.
