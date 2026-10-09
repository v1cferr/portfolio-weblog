import { ArrowUpRightIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { describeEntity } from "@/lib/entities";

import { LaneDot, laneOf } from "./lane";
import { SectionHeading } from "./page-header";

const LISTED = ["experience", "project", "education", "certification", "post"] as const;
type Listed = (typeof LISTED)[number];

/**
 * Everything connected to an entity, in both directions: a project lists the
 * experiences it declares and the posts that declare it.
 */
export async function RelatedContent({ id }: { id: string }) {
  const [locale, t, kind] = await Promise.all([getLocale(), getTranslations("Common"), getTranslations("Kind")]);
  const seen = new Set<string>();
  const items = getContent()
    .getRelatedContent(id)
    .filter((ref): ref is typeof ref & { type: Listed } => (LISTED as readonly string[]).includes(ref.type))
    .filter((ref) => (seen.has(ref.id) ? false : (seen.add(ref.id), true)))
    .map((ref) => describeEntity(ref.id, locale))
    .filter((entity) => entity?.href !== undefined);

  if (items.length === 0) return null;
  return (
    <section aria-labelledby="related" className="mt-14">
      <SectionHeading id="related">{t("related")}</SectionHeading>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((entity) => {
          if (entity?.href === undefined) return null;
          const lane = laneOf[entity.type as Listed];
          return (
            <li key={entity.id}>
              <Link
                href={entity.href}
                className="group flex h-full flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30"
              >
                <span className="flex items-center gap-2 font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase">
                  <LaneDot lane={lane} />
                  {kind(entity.type)}
                </span>
                <span className="flex items-start justify-between gap-2 font-medium">
                  {entity.title}
                  <ArrowUpRightIcon
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </span>
                {entity.subtitle !== undefined && <span className="line-clamp-2 text-sm text-muted-foreground">{entity.subtitle}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
