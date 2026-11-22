export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://v1cferr.dev").replace(/\/$/, "");
export const REPOSITORY_URL = "https://github.com/v1cferr/portfolio-weblog";

/**
 * Link to a content file as it exists in the deployed commit, so the evidence
 * a reader opens is exactly what the page was built from.
 */
export function sourceUrl(contentFile: string): string {
  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  return `${REPOSITORY_URL}/blob/${ref}/content/${contentFile}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** True for absolute http(s) URLs that point away from v1cferr.dev. */
export function isExternalUrl(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  const host = new URL(href).hostname;
  return host !== "v1cferr.dev" && !host.endsWith(".v1cferr.dev");
}
