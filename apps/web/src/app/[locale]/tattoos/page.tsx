// DRAFT (2026-11-26): the page renders content/profile/tattoos.yaml, which is in
// review; the owner reviews the text on the preview deployment before publishing.
import { localize, localizeList, type Tattoo, type TattooDate, type TattooQuote } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  LanguagesIcon,
  LightbulbIcon,
  MapPinIcon,
  PenLineIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { CopyLink } from "@/components/anchor/copy-link";
import { Lightbox, LightboxTrigger } from "@/components/lightbox/lightbox";
import { galleryId, type LightboxItem } from "@/components/lightbox/photo-param";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { ReviewNotice } from "@/components/review-notice";
import { SessionCollapsible } from "@/components/session-disclosure";
import { SourceLink } from "@/components/source-link";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { getTattoos } from "@/lib/tattoos";

const SOURCE = "profile/tattoos.yaml";
const GALLERY = galleryId("tattoos");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Tattoos");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/tattoos"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/tattoos") },
  };
}

/** "around late 2023" while approximate; the date itself once it is known. */
async function TattooWhen({ date, locale }: { date: TattooDate; locale: Locale }) {
  const t = await getTranslations("Tattoos");
  if (!date.approximate) return <time dateTime={date.on}>{formatPartialDate(date.on, locale)}</time>;
  const text =
    date.part !== undefined || /^\d{4}$/.test(date.on)
      ? t("approxDate", { part: date.part ?? "other", year: date.on })
      : t("approxDay", { date: formatPartialDate(date.on, locale) });
  return (
    <time dateTime={date.on} title={t("approximate")}>
      {text}
    </time>
  );
}

/** The owner's words, verbatim; outside their language, a labelled translation under them. */
async function Quote({ quote, locale }: { quote: TattooQuote; locale: Locale }) {
  const t = await getTranslations("Tattoos");
  const gloss = quote.language !== locale && quote.gloss !== undefined ? localize(quote.gloss, locale) : undefined;
  return (
    <figure className="space-y-1.5 border-l-2 border-brand/60 pl-4">
      <blockquote lang={quote.language} className="text-pretty italic">
        <p>
          <span aria-hidden>“</span>
          {quote.text}
          <span aria-hidden>”</span>
        </p>
      </blockquote>
      {gloss !== undefined && (
        <figcaption lang={gloss.locale} className="flex gap-1.5 text-sm text-muted-foreground">
          <LanguagesIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="sr-only">{t("translation")}: </span>
            {gloss.value}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

async function TattooCard({ tattoo, locale, photoIndex }: { tattoo: Tattoo; locale: Locale; photoIndex: number }) {
  const t = await getTranslations("Tattoos");
  const title = localize(tattoo.title, locale);
  const origin = localize(tattoo.origin, locale);
  const placement = localize(tattoo.placement, locale);
  const meaning = localize(tattoo.meaning, locale);
  const body = localizeList(tattoo.body, locale);
  const values = tattoo.values === undefined ? undefined : localizeList(tattoo.values, locale);
  const alt = tattoo.media === undefined ? undefined : localize(tattoo.media.alt, locale);
  const titleId = `${tattoo.id}-title`;
  const idea = tattoo.state === "idea";

  return (
    <Card
      variant="glass"
      id={tattoo.id}
      data-anchor=""
      data-tattoo={tattoo.id}
      data-state={tattoo.state}
      className="group/anchor gap-0 rounded-2xl py-0 sm:flex-row"
    >
      {tattoo.media !== undefined && alt !== undefined ? (
        <LightboxTrigger
          index={photoIndex}
          className="relative block aspect-[4/5] max-h-[28rem] shrink-0 overflow-hidden border-b bg-muted sm:max-h-none sm:w-64 sm:border-r sm:border-b-0 lg:w-72"
          frameClassName="absolute inset-0"
        >
          <Image
            src={tattoo.media.src}
            alt={alt.value}
            fill
            sizes="(min-width: 1024px) 288px, (min-width: 640px) 256px, 100vw"
            className="object-cover transition-transform hover:scale-[1.02]"
          />
        </LightboxTrigger>
      ) : (
        idea && (
          // No photo for something that does not exist: the symbol itself, drawn in type.
          <div
            aria-hidden
            className="flex aspect-[2/1] shrink-0 items-center justify-center border-b border-dashed bg-muted/40 font-display text-8xl text-muted-foreground sm:aspect-auto sm:w-64 sm:border-r sm:border-b-0 lg:w-72"
          >
            φ
          </div>
        )
      )}
      <CardContent className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="space-y-1">
          <p lang={origin.locale} className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {origin.value}
          </p>
          <div className="flex items-start gap-1">
            <h3 id={titleId} lang={title.locale} className="flex flex-1 flex-wrap items-center gap-2 font-display text-2xl font-semibold">
              {title.value}
              {idea && (
                <Badge variant="outline" className="border-dashed font-sans text-xs font-normal">
                  <LightbulbIcon aria-hidden />
                  {t("idea")}
                </Badge>
              )}
            </h3>
            <CopyLink id={tattoo.id} nameId={titleId} className="mt-1" />
          </div>
        </div>

        <dl className="flex flex-wrap gap-2 text-sm">
          <div className="contents">
            <dt className="sr-only">{t("placement")}</dt>
            <dd>
              <Badge variant="secondary" className="h-auto py-1 whitespace-normal">
                <MapPinIcon aria-hidden />
                <span lang={placement.locale}>{placement.value}</span>
              </Badge>
            </dd>
          </div>
          {tattoo.date !== undefined && (
            <div className="contents">
              <dt className="sr-only">{t("date")}</dt>
              <dd>
                <Badge variant="secondary" className="h-auto py-1 whitespace-normal">
                  <CalendarIcon aria-hidden />
                  <TattooWhen date={tattoo.date} locale={locale} />
                </Badge>
              </dd>
            </div>
          )}
        </dl>

        <p lang={meaning.locale} className="text-lg leading-snug text-pretty">
          {meaning.value}
        </p>

        {body !== undefined && (
          <div lang={body.locale} className="space-y-3 text-pretty text-muted-foreground">
            {body.value.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {values !== undefined && values.value.length > 0 && (
          <ul lang={values.locale} aria-label={t("values")} className="flex flex-wrap gap-1.5">
            {values.value.map((value) => (
              <li key={value}>
                <Badge variant="outline">{value}</Badge>
              </li>
            ))}
          </ul>
        )}

        {tattoo.quotes.length > 0 && (
          // Folded by default to keep the card short; open stays open for the tab (docs/guides/ui-state.md).
          <SessionCollapsible stateId={`quotes:${tattoo.id}`} className="group/quotes border-t pt-2">
            <CollapsibleTrigger className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
              <PenLineIcon aria-hidden className="size-4 text-muted-foreground" />
              {t("inMyWords")}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {t("quoteCount", { count: tattoo.quotes.length })}
              </span>
              <ChevronDownIcon aria-hidden className="size-4 transition-transform group-data-[state=open]/quotes:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2 pb-1">
              {tattoo.quotes.map((quote) => (
                <Quote key={quote.text} quote={quote} locale={locale} />
              ))}
            </CollapsibleContent>
          </SessionCollapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default async function TattoosPage() {
  const locale = await getLocale();
  const t = await getTranslations("Tattoos");
  const page = getTattoos();
  if (page === undefined) notFound();

  const done = page.tattoos.filter((tattoo) => tattoo.state === "done");
  const ideas = page.tattoos.filter((tattoo) => tattoo.state === "idea");
  const photos = done.flatMap((tattoo) => (tattoo.media === undefined ? [] : [{ tattoo, media: tattoo.media }]));
  const lightboxItems = photos.map(({ media }): LightboxItem => {
    const alt = localize(media.alt, locale);
    const caption = media.caption && localize(media.caption, locale);
    return {
      src: media.src,
      width: media.width,
      height: media.height,
      alt: alt.value,
      altLang: alt.locale,
      caption: caption?.value,
      captionLang: caption?.locale,
    };
  });
  // The companion post, linked only while it is visible too.
  const post = page.post === undefined ? undefined : getContent().getPost(page.post, locale);
  const manifestoGloss = page.manifesto.language !== locale && page.manifesto.gloss ? localize(page.manifesto.gloss, locale) : undefined;

  return (
    <PageTransition>
      <PageHeader source={{ path: SOURCE }} icon={SparklesIcon} title={t("title")} description={t("description")} info={t("info")} />

      {page.status === "review" && <ReviewNotice />}

      <figure id="manifesto" data-anchor="" className="group/anchor relative mb-14 max-w-3xl space-y-3">
        <blockquote lang={page.manifesto.language} className="font-display text-2xl leading-snug font-medium text-balance md:text-3xl">
          <p>{page.manifesto.text}</p>
        </blockquote>
        {manifestoGloss !== undefined && (
          <figcaption lang={manifestoGloss.locale} className="flex gap-1.5 text-muted-foreground">
            <LanguagesIcon aria-hidden className="mt-1 size-4 shrink-0" />
            <span>
              <span className="sr-only">{t("translation")}: </span>
              {manifestoGloss.value}
            </span>
          </figcaption>
        )}
        <CopyLink id="manifesto" name={t("manifesto")} className="absolute -top-1 -right-1 sm:-right-8" />
      </figure>

      <div className="space-y-14">
        <section aria-labelledby="on-my-skin">
          <SectionHeading id="on-my-skin" icon={PenLineIcon}>
            {t("tattoos")}
          </SectionHeading>
          <Lightbox id={GALLERY} items={lightboxItems}>
            <ul className="space-y-6">
              {done.map((tattoo) => (
                <li key={tattoo.id}>
                  <TattooCard tattoo={tattoo} locale={locale} photoIndex={photos.findIndex((photo) => photo.tattoo === tattoo)} />
                </li>
              ))}
            </ul>
          </Lightbox>
        </section>

        {ideas.length > 0 && (
          <section aria-labelledby="ideas">
            <SectionHeading id="ideas" icon={LightbulbIcon} info={t("ideasInfo")}>
              {t("ideas")}
            </SectionHeading>
            <ul className="space-y-6">
              {ideas.map((tattoo) => (
                <li key={tattoo.id}>
                  <TattooCard tattoo={tattoo} locale={locale} photoIndex={-1} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {post !== undefined && (
          <Link
            href={`/weblog/${post.slug}`}
            className="group/link glass flex max-w-3xl items-center gap-4 rounded-2xl border p-4 transition-colors hover:border-foreground/30 sm:p-6"
          >
            <span className="min-w-0 flex-1 space-y-1">
              <span className="block font-mono text-xs tracking-wide text-muted-foreground uppercase">{t("readPost")}</span>
              <span lang={post.locale} className="block font-display text-xl font-semibold text-balance">
                {post.frontmatter.title}
              </span>
              <span className="block text-sm text-pretty text-muted-foreground">{t("readPostDescription")}</span>
            </span>
            <ArrowRightIcon aria-hidden className="icon-fwd size-5 shrink-0" />
          </Link>
        )}
      </div>

      <div className="mt-12">
        <SourceLink file={SOURCE} />
      </div>
    </PageTransition>
  );
}
