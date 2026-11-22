import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Weblog post by Victor Ferreira on v1cferr.dev";

export const dynamicParams = false;

// A route handler sits outside the [locale] layout, so it lists the locale too.
export function generateStaticParams() {
  const slugs = getContent().getPostSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

/** A post's share card: title, summary and publication date, in the language the page shows. */
export default async function PostImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: requested, slug } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const post = getContent().getPost(slug, locale);
  if (post === undefined) notFound();
  const kind = await getTranslations({ locale, namespace: "Kind" });
  const { title, summary, publishedAt } = post.frontmatter;
  // The date follows the post's language: the card's fonts carry no CJK glyphs.
  return renderOgImage({
    storePath: storePath(`weblog/${slug}`).label,
    title,
    subtitle: summary,
    meta: publishedAt === undefined ? undefined : formatPartialDate(publishedAt, post.locale),
    section: kind("post"),
    lane: "writing",
    command: `open /weblog/${slug}`,
  });
}
