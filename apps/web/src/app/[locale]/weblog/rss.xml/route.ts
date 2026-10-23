import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { languageTag } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 per locale; only published, public posts (fallback translations included, marked by their language). */
export async function GET(_request: Request, { params }: RouteContext<"/[locale]/weblog/rss.xml">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response("Unknown locale", { status: 404 });
  // Route handlers cannot read root params, so the locale is passed explicitly.
  const t = await getTranslations({ locale, namespace: "Weblog" });
  const content = getContent();
  const items = content
    .getPosts(locale)
    .map((post) => {
      const url = absoluteUrl(`/${post.locale}/weblog/${post.slug}`);
      const date = post.frontmatter.publishedAt;
      return [
        "<item>",
        `<title>${escape(post.frontmatter.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<description>${escape(post.frontmatter.summary)}</description>`,
        date !== undefined ? `<pubDate>${new Date(`${date.length === 10 ? date : `${date}-01`}T12:00:00Z`).toUTCString()}</pubDate>` : "",
        ...post.frontmatter.tags.map((tag) => `<category>${escape(tag)}</category>`),
        "</item>",
      ].join("");
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escape(`${content.getProfile().name} · ${t("title")}`)}</title><link>${absoluteUrl(`/${locale}/weblog`)}</link><atom:link href="${absoluteUrl(`/${locale}/weblog/rss.xml`)}" rel="self" type="application/rss+xml"/><description>${escape(t("description"))}</description><language>${languageTag(locale)}</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
