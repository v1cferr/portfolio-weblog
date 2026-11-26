import { localize, localizeList, type Locale, type PublishedRecommendation } from "@workspace/content";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowUpRightIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ExternalLink } from "@/components/external-link";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";

/** Texts longer than this, in more than one paragraph, open on the first paragraph with "Read all". */
const COLLAPSE_AFTER = 1000;

/** The anchor of a recommendation's card on the About page. */
export const recommendationAnchor = (id: string) => `recommendation-${id}`;

/** First letters of the first and last names: "Júlio César Raveli" → "JR". */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => word !== "");
  return [words[0], words.length > 1 ? words.at(-1) : undefined].map((word) => word?.[0] ?? "").join("");
}

/**
 * The text in the visitor's language when a current translation exists, else
 * the original. A stale translation (the original changed since) is never shown.
 */
function shownText(item: PublishedRecommendation, locale: Locale) {
  const original = { value: item.text[item.language] ?? [], locale: item.language };
  if (item.translationStale === true) return original;
  return localizeList(item.text, locale) ?? original;
}

function shownExcerpt(item: PublishedRecommendation, locale: Locale) {
  if (item.excerpt === undefined) return undefined;
  const excerpt = localize(item.excerpt, locale);
  if (item.translationStale === true && excerpt.locale !== item.language) {
    const original = item.excerpt[item.language];
    return original === undefined ? undefined : { value: original, locale: item.language };
  }
  return excerpt;
}

function RecommenderAvatar({ item }: { item: PublishedRecommendation }) {
  return (
    <Avatar size="lg" className="size-12 data-[size=lg]:size-12">
      {item.photo !== undefined && <AvatarImage src={item.photo} alt="" />}
      <AvatarFallback aria-hidden className="font-mono text-sm">
        {initials(item.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * One recommendation: the quote (an excerpt on the home page, the whole text
 * on About), who wrote it, how we know each other and when, and a link to the
 * original on LinkedIn. A translation says so; the original keeps its own
 * `lang`.
 */
export async function RecommendationCard({ item, full = false }: { item: PublishedRecommendation; full?: boolean }) {
  const locale = await getLocale();
  const t = await getTranslations("Recommendations");
  const organization = getContent().getOrganization(item.relation.organization);
  const relation = localize(item.relation.label, locale);
  const text = shownText(item, locale);
  const excerpt = full ? undefined : shownExcerpt(item, locale);
  const quoteLocale = excerpt?.locale ?? text.locale;
  const translated = quoteLocale !== item.language;
  const collapsible = full && text.value.length > 1 && text.value.join("").length > COLLAPSE_AFTER;
  const [first = "", ...rest] = text.value;

  const paragraph = (value: string) => <p key={value}>{value}</p>;
  const quoteClass = cn("space-y-3 text-pretty", full ? "text-base leading-relaxed" : "text-lg leading-snug");

  return (
    <Card
      variant="glass"
      id={full ? recommendationAnchor(item.id) : undefined}
      data-recommendation={item.id}
      className="h-full scroll-mt-24 gap-5 rounded-2xl pb-0"
    >
      <CardContent className="flex flex-1 flex-col gap-3">
        {collapsible ? (
          <Collapsible className="group/text space-y-1">
            <blockquote lang={quoteLocale} className={quoteClass}>
              {paragraph(first)}
              <CollapsibleContent forceMount className="space-y-3 data-[state=closed]:hidden">
                {rest.map(paragraph)}
              </CollapsibleContent>
            </blockquote>
            <CollapsibleTrigger className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-lane-career underline-offset-4 hover:underline">
              <span className="group-data-[state=open]/text:hidden">{t("readAll")}</span>
              <span className="hidden group-data-[state=open]/text:inline">{t("showLess")}</span>
              <ChevronDownIcon aria-hidden className="size-4 transition-transform group-data-[state=open]/text:rotate-180" />
            </CollapsibleTrigger>
          </Collapsible>
        ) : (
          <blockquote lang={quoteLocale} className={quoteClass}>
            {excerpt !== undefined ? (
              <p>
                <span aria-hidden>“</span>
                {excerpt.value}
                <span aria-hidden>”</span>
              </p>
            ) : (
              text.value.map(paragraph)
            )}
          </blockquote>
        )}
        {translated && (
          <p data-translated="" className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <LanguagesIcon aria-hidden className="size-3.5" />
            {t("translated", { language: item.language })}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 bg-transparent">
        <div className="flex items-center gap-3">
          <RecommenderAvatar item={item} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground" lang={item.language}>
              {item.jobTitle}
              {item.company !== undefined && ` · ${item.company}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            {organization !== undefined && <OrganizationMark organization={organization} size="xs" />}
            <span lang={relation.locale}>{relation.value}</span>
            <span aria-hidden>·</span>
            <time dateTime={item.date}>{formatPartialDate(item.date, locale)}</time>
          </p>
          <ExternalLink
            href={item.url}
            className="group/link inline-flex min-h-11 items-center gap-0.5 font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("onLinkedIn")}
            <ArrowUpRightIcon aria-hidden className="icon-out size-3.5" />
          </ExternalLink>
        </div>
      </CardFooter>
    </Card>
  );
}

/** The home page's few, in the order the owner chose. */
export function featuredRecommendations(): PublishedRecommendation[] {
  return getContent()
    .getRecommendations()
    .filter((item) => item.featured !== undefined)
    .sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));
}

/** "Recommendations from this period" on a job page: who, linking to the full card on About. */
export async function RecommendationLinks({ items }: { items: readonly PublishedRecommendation[] }) {
  if (items.length === 0) return null;
  const locale = await getLocale();
  const t = await getTranslations("Recommendations");
  return (
    <section aria-labelledby="recommendations-here" className="space-y-3">
      <h2 id="recommendations-here" className="text-xl font-semibold">
        {t("fromThisPeriod")}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const relation = localize(item.relation.label, locale);
          return (
            <li key={item.id}>
              <Link
                href={`/about#${recommendationAnchor(item.id)}`}
                className="glass flex min-h-11 items-center gap-3 rounded-xl border p-3 transition-colors hover:border-lane-career/50"
              >
                <RecommenderAvatar item={item} />
                <span className="min-w-0">
                  <span className="block font-medium">{item.name}</span>
                  <span className="block text-sm text-muted-foreground" lang={relation.locale}>
                    {relation.value}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
