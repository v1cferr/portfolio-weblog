import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const workspaceRoot = path.join(import.meta.dirname, "../..");

/** v1 pages that v2 does not rebuild (docs/migration/inventory.md), sent to the closest page. */
const retiredRoutes = [
  { from: "wow", to: "about" },
  { from: "vscode", to: "setup" },
  { from: "goals", to: "about" },
  { from: "context", to: "about" },
  { from: "thanks", to: "about" },
  { from: "certifications", to: "education" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    "/**": ["../../content/**/*", "../../pnpm-workspace.yaml"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
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
