import { RssIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/features/weblog/post-card";
import { getContent } from "@/lib/content";
import { pageAlternates } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Weblog");
  return { title: t("title"), description: t("description"), alternates: pageAlternates(locale, "/weblog") };
}

export default async function WeblogPage() {
  const locale = await getLocale();
  const t = await getTranslations("Weblog");
  const posts = getContent().getPosts(locale);
  return (
    <>
      <PageHeader eyebrow="content/weblog" title={t("title")} description={t("description")}>
        <a
          href={`/${locale}/weblog/rss.xml`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <RssIcon className="size-4" aria-hidden /> {t("rss")}
        </a>
      </PageHeader>
      {posts.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="max-w-4xl border-t">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </>
  );
}
