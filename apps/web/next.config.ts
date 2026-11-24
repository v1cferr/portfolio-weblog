import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const workspaceRoot = path.join(import.meta.dirname, "../..");

/** v1 pages that v2 does not rebuild (docs/migration/inventory.md), sent to the closest page. */
const retiredRoutes = [
  { from: "vscode", to: "setup" },
  { from: "goals", to: "about" },
  { from: "context", to: "about" },
  { from: "thanks", to: "about" },
  { from: "certifications", to: "education" },
];

const isDev = process.env.NODE_ENV === "development";
// Previews load the Vercel toolbar from vercel.live; production never does.
const vercelLive = process.env.VERCEL_ENV === "preview" ? " https://vercel.live" : "";

/*
 * A static CSP, not a nonce one: nonces force every page to render per request,
 * which would turn off ISR for a site that is almost entirely static. Scripts
 * keep 'unsafe-inline' because the App Router inlines its RSC payload; every
 * other directive is strict. ADR 0009 has the trade-off.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${vercelLive}`,
  `style-src 'self' 'unsafe-inline'${vercelLive}`,
  // i.scdn.co: the Spotify album cover in the now-playing chip. render.worldofwarcraft.com:
  // WoW character renders (served through /_next/image, allowed should one be shown directly).
  `img-src 'self' blob: data: https://i.scdn.co https://render.worldofwarcraft.com${vercelLive}`,
  `font-src 'self'${vercelLive}`,
  `connect-src 'self'${vercelLive}`,
  `frame-src ${vercelLive === "" ? "'none'" : vercelLive.trim()}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // No preload: the preload list is hard to leave, and *.v1cferr.dev also serves the homelab.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    "@workspace/ui",
    "@workspace/content",
    "@workspace/search",
    "@workspace/github",
  ],
  // The content lives outside the app; pages rendered on demand (ISR) read it
  // at runtime, so it has to ship with the server output.
  outputFileTracingRoot: workspaceRoot,
  outputFileTracingIncludes: {
    // assets/fonts: read by the opengraph-image routes (src/lib/og-image.tsx).
    "/**": ["../../content/**/*", "../../pnpm-workspace.yaml", "./assets/fonts/*.ttf"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Character renders on /wow, from Blizzard's render host only (lib/battlenet.ts checks the URL too).
    remotePatterns: [
      { protocol: "https", hostname: "render.worldofwarcraft.com", pathname: "/**" },
    ],
  },
  headers() {
    return Promise.resolve([{ source: "/:path*", headers: securityHeaders }]);
  },
  redirects() {
    return Promise.resolve(
      retiredRoutes.map(({ from, to }) => ({
        source: `/:locale(en-us|pt-br|zh-cn)/${from}`,
        destination: `/:locale/${to}`,
        permanent: true,
      }))
    );
  },
};

export default withNextIntl(nextConfig);
