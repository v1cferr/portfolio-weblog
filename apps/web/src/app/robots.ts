import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments are not the canonical site; keep them out of indexes.
  const isProduction = process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production";
  return isProduction
    ? { rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }], sitemap: absoluteUrl("/sitemap.xml") }
    : { rules: [{ userAgent: "*", disallow: "/" }] };
}
