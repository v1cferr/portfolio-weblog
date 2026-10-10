import type { Post } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { getTranslations } from "next-intl/server";

import { PartialDate } from "@/components/date-range";
import { Link } from "@/i18n/navigation";

export async function PostCard({ post }: { post: Post }) {
  const t = await getTranslations("Weblog");
  const fm = post.frontmatter;
  return (
    <article className="group relative grid gap-2 border-b py-6 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
      <div className="flex items-center gap-2 sm:flex-col sm:items-start">
        {fm.publishedAt !== undefined && <PartialDate date={fm.publishedAt} />}
        <span className="font-mono text-[0.7rem] tracking-wide text-lane-writing uppercase">{t(`category.${fm.category}`)}</span>
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl leading-tight font-semibold text-balance">
          <Link href={`/weblog/${post.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
            {fm.title}
          </Link>
        </h2>
        <p className="text-pretty text-muted-foreground" lang={post.locale}>
          {fm.summary}
        </p>
        {fm.tags.length > 0 && (
          <ul className="relative z-10 flex flex-wrap gap-1.5" aria-label={t("tags")}>
            {fm.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary" asChild className="font-mono font-normal">
                  <Link href={`/weblog/tags/${tag}`}>#{tag}</Link>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
