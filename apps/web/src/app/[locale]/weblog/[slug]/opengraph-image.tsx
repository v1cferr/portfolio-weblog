import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { ogImageAlt, ogImageMetadata, ogLocale, renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export async function generateImageMetadata({ params }: { params: { locale: string; slug: string } }) {
  const locale = ogLocale(params.locale);
  const post = getContent().getPost(params.slug, locale);
  if (post === undefined) return [];
  return ogImageMetadata(await ogImageAlt(locale, post.frontmatter.title));
}

/** A post's share card: title, summary and publication date, in the language the page shows. */
export default async function PostImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: requested, slug } = await params;
  const locale = ogLocale(requested);
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
