# Search and discoverability

Goal: a search for the owner's name ("Victor Ferreira") or nickname ("v1cferr",
"V1C") finds this site and its profiles, in classic results and in AI answers.

## What the site does

| Signal             | Where                                                         | Notes                                                                                                |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Site name          | `WebSite` JSON-LD on the home page (`lib/structured-data.ts`) | `name` is the real name; `alternateName` lists the handle, the aliases and the domain, in that order |
| Person             | `Person` JSON-LD, `@id` `https://v1cferr.dev/#person`         | `alternateName` = handle + `aliases` from `profile.yaml`; `sameAs` = every public profile link       |
| Profile page       | `ProfilePage` JSON-LD on `/[locale]/about`                    | Its `mainEntity` is the same Person                                                                  |
| Posts              | `BlogPosting` JSON-LD                                         | `author` points at the Person's `@id`                                                                |
| Home title         | `app/[locale]/page.tsx`                                       | "Victor Ferreira (v1cferr, V1C)"; other pages use "Page · Victor Ferreira"                           |
| Languages          | `hreflang` alternates in the head and in `sitemap.xml`        | en-us, pt-br, zh-cn                                                                                  |
| Sitemap and robots | `app/sitemap.ts`, `app/robots.ts`                             | Previews are `Disallow: /`; production allows everything but `/api/`                                 |

Google's guidance for AI Overviews and AI Mode (May 2026) asks for nothing
beyond this: crawlable pages, good mobile experience and original content. No
`llms.txt` or special markup is needed, and Google says it does not use
`llms.txt` for ranking.

Validate structured data with the
[Schema Markup Validator](https://validator.schema.org/) (Google's Rich Results
Test does not cover site names).

## Cloudflare's managed robots.txt

Cloudflare prepends its own rules to `robots.txt`: it blocks AI training
crawlers (GPTBot, ClaudeBot, Google-Extended and others) and sends
`Content-Signal: search=yes, ai-train=no, use=reference`. `ai-input` (content
used to ground AI answers) is not set, so it is neither granted nor refused.
Googlebot, Bingbot and the AI search crawlers (OAI-SearchBot, PerplexityBot) are
allowed. Blocking Google-Extended does not remove the site from Google's AI
Overviews, which use Googlebot.

## Owner checklist (needs the owner's accounts)

| Step                                          | Why                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| Verify `v1cferr.dev` in Google Search Console | Domain property via a DNS TXT record (Cloudflare); then submit `sitemap.xml`   |
| Request indexing of the home and About pages  | Speeds up the first crawl after the structured data change                     |
| Import the property into Bing Webmaster Tools | Bing (and the assistants built on it) from the same verification               |
| Link back to the site from every profile      | GitHub, LinkedIn and X: a "website" field pointing here makes `sameAs` two-way |
| Decide `ai-input` in Cloudflare               | `yes` explicitly allows AI answers to cite the site; training can stay `no`    |

Search results change only after a recrawl, which takes days to weeks.
