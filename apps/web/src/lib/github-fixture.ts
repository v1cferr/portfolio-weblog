import type { GitHubRepo, LanguagesResult } from "@workspace/github";

/*
 * What GitHub answers in builds made with GITHUB_FIXTURES=1 (CI and the e2e
 * suite), so the tests never depend on the network or on a rate limit. A
 * snapshot of the owner's public repositories taken on 2026-11-26, with two
 * deliberate differences that exercise the edge cases:
 *
 * - acuttis-point is left out, as if it were private: its page shows no
 *   repository link and no languages;
 * - encriptador-descriptador is marked archived (it is not, on GitHub).
 *
 * Never used in production: lib/github.ts reads it only under the flag.
 */

/** When the snapshot was taken: "now" for anything computed from it, so builds stay the same over time. */
export const FIXTURE_TAKEN_AT = new Date("2026-11-26T12:00:00Z");

const repo = (name: string, createdAt: string, pushedAt: string, language: string | null, extra: Partial<GitHubRepo> = {}): GitHubRepo => ({
  name,
  full_name: `v1cferr/${name}`,
  private: false,
  visibility: "public",
  fork: false,
  archived: false,
  description: null,
  html_url: `https://github.com/v1cferr/${name}`,
  homepage: null,
  language,
  topics: [],
  stargazers_count: 0,
  created_at: createdAt,
  pushed_at: pushedAt,
  ...extra,
});

export const FIXTURE_REPOS: GitHubRepo[] = [
  repo("portfolio-weblog", "2024-06-28T01:04:40Z", "2026-11-26T14:52:17Z", "TypeScript"),
  repo("dotfiles", "2025-08-29T17:24:35Z", "2026-11-25T16:23:37Z", "Nix"),
  repo("betterpip", "2026-11-08T13:27:10Z", "2026-11-08T23:18:32Z", "Python"),
  repo("grad-radar", "2026-08-06T16:51:24Z", "2026-11-03T15:28:33Z", "Python"),
  repo("imobos", "2026-10-03T19:11:33Z", "2026-10-18T01:35:40Z", "TypeScript"),
  repo("signal-sift", "2026-10-15T23:03:13Z", "2026-10-16T16:36:03Z", "Rust"),
  repo("credit-radar", "2026-09-09T23:32:12Z", "2026-09-10T20:16:48Z", "TypeScript"),
  repo("ascension-coa-scraper", "2026-08-14T00:33:53Z", "2026-09-03T22:44:34Z", "Python"),
  repo("ufscar-housing-radar", "2026-06-23T22:41:27Z", "2026-06-30T18:24:48Z", "Python"),
  repo("obsidian-rag", "2026-06-09T23:05:06Z", "2026-06-10T02:12:33Z", "Python"),
  repo("technical-challenges", "2025-03-23T18:02:44Z", "2025-05-22T15:18:04Z", "TypeScript"),
  repo("learning-react-next", "2024-05-11T23:36:11Z", "2024-09-29T10:05:22Z", "HTML"),
  repo("qr-code-component", "2024-03-05T20:52:10Z", "2024-03-06T19:56:26Z", "CSS"),
  repo("orion-bootcamp", "2023-10-07T18:56:05Z", "2023-10-25T01:03:52Z", "TypeScript"),
  repo("encriptador-descriptador", "2023-06-13T14:25:37Z", "2023-06-13T14:33:43Z", "CSS", { archived: true }),
  repo("barberia-alura", "2023-05-27T21:19:50Z", "2023-05-27T22:32:22Z", "HTML"),
];

/** Bytes per language, as GET /repos/{owner}/{repo}/languages answered on 2026-11-26. */
const LANGUAGES: Record<string, Record<string, number>> = {
  "v1cferr/dotfiles": {
    Nix: 936_567,
    QML: 894_263,
    TypeScript: 229_387,
    Python: 203_614,
    Shell: 98_945,
    Lua: 50_537,
    JavaScript: 2200,
    CSS: 1840,
    Awk: 854,
  },
  "v1cferr/portfolio-weblog": { TypeScript: 1_242_743, MDX: 54_814, CSS: 24_501, JavaScript: 6599, Nix: 1883, Shell: 10 },
  "v1cferr/imobos": {
    TypeScript: 265_944,
    Python: 111_758,
    Shell: 9460,
    CSS: 4316,
    Dockerfile: 3206,
    Nix: 2005,
    JavaScript: 559,
    Mako: 339,
  },
  "v1cferr/encriptador-descriptador": { CSS: 13_988, JavaScript: 7399, HTML: 3338 },
};

export const FIXTURE_FETCHED_AT = "2026-11-26T12:00:00.000Z";

/** A repository missing from the map answers like an empty one (`{}`). */
export function fixtureLanguages(fullName: string): LanguagesResult {
  return { ok: true, languages: LANGUAGES[fullName.toLowerCase()] ?? {}, fetchedAt: FIXTURE_FETCHED_AT };
}
