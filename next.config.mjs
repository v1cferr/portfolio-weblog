/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/**
 * Next.js configuration
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */
const nextConfig = {
  // React strict mode, which surfaces problems during development
  reactStrictMode: true,

  /**
   * Emits .next/standalone, the self-contained bundle the Docker image runs.
   * Kept behind a flag because Vercel produces its own output format and does
   * not need this mode.
   */
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" } : {}),
  /**
   * Remote image optimisation
   * Hosts next/image is allowed to optimise
   * @see https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
   */
  images: {
    remotePatterns: [
      // Spotify artwork
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/**",
      },
      // Placeholder images (optional, worth removing in production)
      {
        protocol: "https",
        hostname: "random.imagecdn.app",
        port: "",
        pathname: "/**",
      },
      // World of Warcraft character renders
      {
        protocol: "https",
        hostname: "render.worldofwarcraft.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /**
   * webpack setup for SVG
   * Allows importing SVGs as React components through @svgr/webpack
   */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default withNextIntl(nextConfig);
