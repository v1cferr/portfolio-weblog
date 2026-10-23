# 0005. TypeScript 6.0 and ESLint 10

- Status: accepted (2026-10-09)
- Jira: PWL-99

## Context

At the time of the rebuild the latest releases were TypeScript 7.0 and ESLint
10.12. Lint is type-aware (typescript-eslint `strictTypeChecked`) and includes
`eslint-config-next`.

## Decision

- **TypeScript 6.0**: typescript-eslint 8 supports `>=4.8.4 <6.1.0`. TypeScript
  7 would leave type-aware linting unsupported.
- **ESLint 10**: ESLint 9 is out of support. `eslint-plugin-react`,
  `eslint-plugin-jsx-a11y` and `eslint-plugin-import` (pulled in by
  `eslint-config-next`) still declare `^9` peers. They run correctly on 10, so
  the peer warning is accepted rather than pinning an unsupported ESLint.
- **Playwright 1.61.1**: pinned to the version nixpkgs ships, so the Nix shell's
  browsers match.

## When to revisit

Move to TypeScript 7 when typescript-eslint supports it. Drop the accepted peer
warning when the React plugins declare ESLint 10.
