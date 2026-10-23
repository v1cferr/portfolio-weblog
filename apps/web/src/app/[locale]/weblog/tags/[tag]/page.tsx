import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/features/weblog/post-card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { pageAlternates } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  const tags = new Set(
    routing.locales.flatMap((locale) =>
      getContent()
        .getPosts(locale)
        .flatMap((post) => post.frontmatter.tags)
    )
  );
  return [...tags].map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/weblog/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Weblog");
  return { title: t("taggedWith", { tag }), alternates: pageAlternates(locale, `/weblog/tags/${tag}`), robots: { index: false } };
}

export default async function TagPage({ params }: PageProps<"/[locale]/weblog/tags/[tag]">) {
  const { tag } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Weblog");
  const posts = getContent()
    .getPosts(locale)
    .filter((post) => post.frontmatter.tags.includes(tag));
  if (posts.length === 0) notFound();
  return (
    <>
      <PageHeader eyebrow="content/weblog" title={t("taggedWith", { tag })}>
        <Link href="/weblog" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("title")}
        </Link>
      </PageHeader>
      <div className="max-w-4xl border-t">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}
