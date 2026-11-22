# 0009. Security headers with a static CSP

- Status: accepted (2026-11-22, decided with the owner)

## Context

A security review of v1cferr.dev on 2026-11-22 (made against v1, kept outside
the repository) found no Content-Security-Policy, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy or X-Frame-Options, HSTS without
`includeSubDomains`, and `x-powered-by` exposing the framework. v2 inherited the
missing headers.

Next.js offers two ways to send a CSP:

- **Nonces**, set per request in `proxy.ts`. Every page then renders on demand:
  static optimization and ISR turn off, and the CDN cannot cache HTML.
- **A static policy** in `next.config.ts`. Pages stay static, but scripts need
  `'unsafe-inline'`, because the App Router inlines its RSC payload in
  `<script>` tags. Subresource Integrity is still experimental and does not
  cover those inline scripts either.

## Decision

- **A static CSP** in `apps/web/next.config.ts`, sent on every path. Every
  directive except `script-src` and `style-src` is strict: `default-src 'self'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`, and `img-src` allows only the site and `i.scdn.co`
  (Spotify covers). Previews also allow `vercel.live`, for the Vercel toolbar.
- **Hardening headers:** `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a
  `Permissions-Policy` that turns off camera, microphone, geolocation, payment,
  USB and topics, and `Cross-Origin-Opener-Policy: same-origin`.
- **HSTS with `includeSubDomains`, without `preload`.** Leaving the preload list
  takes months, and `*.v1cferr.dev` also names the homelab.
- **`poweredByHeader: false`.**
- **Tests guard it:** the e2e smoke test fails on any console error, which
  includes CSP violations, and a header test checks every header above.

## Consequences

- A new third-party origin (an embed, an image host, an analytics script) has to
  be added to the policy on purpose, or it is blocked.
- `'unsafe-inline'` in `script-src` leaves the CSP weaker against injected
  inline scripts than a nonce policy would be. The site renders no user input,
  so the risk is small; revisit if Next.js ships hash-based CSP for static
  pages.
