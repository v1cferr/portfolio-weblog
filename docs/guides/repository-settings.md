# Repository settings

Settings that live on GitHub are declared here so they can be reviewed and
re-applied, the same way as in `v1cferr/dotfiles`.

## Rulesets

[`.github/rulesets/history.json`](../../.github/rulesets/history.json):
`history` protects `main` from deletion and force-push, with no bypass. Created
on 2026-10-22, before v2 was promoted, so v1 cannot be lost by accident. A merge
into `main` is a fast-forward and stays allowed.

Re-apply after editing the file:

```sh
id=$(gh api repos/v1cferr/portfolio-weblog/rulesets --jq '.[] | select(.name == "history") | .id')
gh api -X PUT "repos/v1cferr/portfolio-weblog/rulesets/$id" --input .github/rulesets/history.json
```

Check what applies to a branch:
`gh api repos/v1cferr/portfolio-weblog/rules/branches/main`.

Tags are not covered by any rule; `archive/*` tags are protected by convention
(never moved, recreated or deleted). See
[`../migration/README.md`](../migration/README.md).
