import { localize, type WowRuleset } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@workspace/ui/components/empty";
import { BirdIcon, ExternalLinkIcon, Gamepad2Icon, PuzzleIcon, SwordsIcon, UserRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ExternalLink } from "@/components/external-link";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { SourceLink } from "@/components/source-link";
import type { Locale } from "@/i18n/routing";
import { type CharacterView, getCharacterViews } from "@/lib/blizzard";
import { formatPartialDate } from "@/lib/dates";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { getAddonList, getWow, sortCharacters } from "@/lib/wow";

// Characters and the add-on list refresh once a day (ADR 0015).
export const revalidate = 86400;

const SOURCE = "games/wow.yaml";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Wow");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/wow"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/wow") },
  };
}

const RULESET_KEY: Record<WowRuleset, "normal" | "pvp" | "rp" | "rpPvp" | "hardcore"> = {
  normal: "normal",
  pvp: "pvp",
  rp: "rp",
  "rp-pvp": "rpPvp",
  hardcore: "hardcore",
};

/** Wowhead's own locale prefixes. */
const WOWHEAD_LOCALE: Record<Locale, string> = { "en-us": "", "pt-br": "pt/", "zh-cn": "cn/" };

async function CharacterCard({ view, locale, syncedAt }: { view: CharacterView; locale: Locale; syncedAt: string | undefined }) {
  const t = await getTranslations("Wow");
  const date = (day: string) => formatPartialDate(day, locale);
  const { character, live } = view;
  const fullName = character.game === "forever" ? `${character.name} ${character.surname}` : character.name;
  const level = live?.level ?? character.level;
  const race = live?.raceName !== undefined ? localize(live.raceName, locale) : undefined;
  const cls = live?.className !== undefined ? localize(live.className, locale) : undefined;
  const raceClass = [race?.value ?? character.race, cls?.value ?? character.class].filter(Boolean).join(" ");
  const place =
    live?.placeName !== undefined
      ? localize(live.placeName, locale).value
      : character.game === "retail"
        ? character.realm
        : character.ruleset !== undefined
          ? t(`rulesets.${RULESET_KEY[character.ruleset]}`)
          : undefined;
  const faction = live?.faction ?? character.faction;
  const note = character.note && localize(character.note, locale);
  return (
    <article className="glass flex h-full min-w-0 gap-4 rounded-xl border p-4">
      {live?.renderUrl !== undefined ? (
        <Image src={live.renderUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-lg border bg-muted object-cover" />
      ) : (
        <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <UserRoundIcon className="size-6" />
        </span>
      )}
      <div className="min-w-0 space-y-1">
        <h3 className="flex flex-wrap items-center gap-2 font-medium">
          {fullName}
          {character.main && <Badge variant="now">{t("main")}</Badge>}
        </h3>
        <p className="text-sm text-muted-foreground">
          {[level !== undefined ? t("level", { level }) : undefined, raceClass || undefined].filter(Boolean).join(" · ")}
        </p>
        <p className="text-sm text-muted-foreground">
          {[place, character.region.toUpperCase(), faction !== undefined ? t(`factions.${faction}`) : undefined]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {live !== undefined && (live.itemLevel !== undefined || (live.achievementPoints ?? 0) > 0) && (
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            {[
              live.itemLevel !== undefined ? t("itemLevel", { value: live.itemLevel }) : undefined,
              // A new WoW Forever character reports 0, which says nothing.
              live.achievementPoints !== undefined && live.achievementPoints > 0
                ? t("achievementPoints", { value: live.achievementPoints.toLocaleString(locale) })
                : undefined,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {note && (
          <p className="text-sm text-pretty" lang={note.locale}>
            {note.value}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <Badge variant="outline" className="h-auto font-mono font-normal whitespace-normal">
            {view.fetchedAt !== undefined
              ? t("live", { date: date(view.fetchedAt.slice(0, 10)) })
              : syncedAt !== undefined
                ? t("snapshot", { date: date(syncedAt) })
                : t("snapshotUndated")}
          </Badge>
          {character.armoryUrl !== undefined && (
            <ExternalLink href={character.armoryUrl} className="inline-flex items-center gap-1 text-sm hover:text-lane-project">
              {t("armory")}
              <ExternalLinkIcon className="size-3" aria-hidden />
            </ExternalLink>
          )}
        </p>
      </div>
    </article>
  );
}

export default async function WowPage() {
  const locale = await getLocale();
  const t = await getTranslations("Wow");
  const wow = getWow();
  if (wow === undefined) notFound();

  const [views, addons] = await Promise.all([
    getCharacterViews(sortCharacters(wow.characters)),
    wow.addons === undefined ? undefined : getAddonList(wow.addons),
  ]);
  const forever = views.filter((view) => view.character.game === "forever");
  const retail = views.filter((view) => view.character.game === "retail");
  const characters = (list: CharacterView[], game: string) =>
    list.length === 0 ? (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SwordsIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ) : (
      <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("charactersLabel", { game })}>
        {list.map((view) => (
          <li
            className="min-w-0"
            key={`${view.character.region}:${view.character.name}:${view.character.game === "forever" ? view.character.surname : view.character.realm}`}
          >
            <CharacterCard view={view} locale={locale} syncedAt={wow.syncedAt} />
          </li>
        ))}
      </ul>
    );

  return (
    <PageTransition>
      <PageHeader source={{ path: SOURCE }} icon={Gamepad2Icon} title={t("title")} description={t("description")} />

      <div className="space-y-14">
        <section aria-labelledby="wow-forever">
          <SectionHeading id="wow-forever" icon={SwordsIcon}>
            {t("forever")}
          </SectionHeading>
          <p className="mb-5 max-w-3xl text-pretty text-muted-foreground">{t("foreverNote")}</p>
          {characters(forever, t("forever"))}
        </section>

        <section aria-labelledby="wow-retail">
          <SectionHeading id="wow-retail" icon={SwordsIcon}>
            {t("retail")}
          </SectionHeading>
          <p className="mb-5">
            <Badge variant="secondary">{t("retailNote")}</Badge>
          </p>
          {characters(retail, t("retail"))}
        </section>

        {wow.wishlist.length > 0 && (
          <section aria-labelledby="wow-wishlist">
            <SectionHeading id="wow-wishlist" icon={BirdIcon}>
              {t("wishlist")}
            </SectionHeading>
            <ul className="grid gap-3 sm:grid-cols-2">
              {wow.wishlist.map((wish) => {
                const name = localize(wish.name, locale);
                const note = wish.note && localize(wish.note, locale);
                return (
                  <li key={wish.wowheadItem} className="glass space-y-1 rounded-xl border p-4">
                    <ExternalLink
                      href={`https://www.wowhead.com/${WOWHEAD_LOCALE[locale]}item=${String(wish.wowheadItem)}`}
                      className="inline-flex items-start gap-1.5 font-medium hover:text-lane-project"
                    >
                      <span lang={name.locale}>{name.value}</span>
                      <ExternalLinkIcon className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden />
                    </ExternalLink>
                    <p className="text-sm text-muted-foreground">
                      {note && <span lang={note.locale}>{note.value} </span>}
                      <span className="font-mono text-xs">
                        #{wish.wowheadItem} {t("onWowhead")}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {addons !== undefined && wow.addons !== undefined && (
          <section aria-labelledby="wow-addons">
            <SectionHeading id="wow-addons" icon={PuzzleIcon}>
              {t("addons")}
            </SectionHeading>
            <p className="mb-2 max-w-3xl text-pretty text-muted-foreground">
              {t.rich("addonsNote", {
                count: addons.total,
                nix: (chunks) => (
                  <ExternalLink href={wow.addons?.package} className="text-foreground underline underline-offset-4 hover:text-lane-project">
                    {chunks}
                  </ExternalLink>
                ),
              })}
            </p>
            {addons.source === "snapshot" && <p className="mb-2 text-sm text-muted-foreground">{t("addonsSnapshot")}</p>}
            <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {addons.groups.map((group) => {
                const title = group.title === undefined ? undefined : localize(group.title, locale);
                return (
                  <section key={group.id} aria-labelledby={`addons-${group.id}`}>
                    <h3
                      id={`addons-${group.id}`}
                      className="mb-2 flex items-baseline justify-between gap-3 border-b pb-1.5 font-mono text-xs tracking-wide text-muted-foreground uppercase"
                    >
                      <span lang={title?.locale}>{title?.value ?? t("otherGroup")}</span>
                      <span className="tabular-nums normal-case">{t("addonCount", { count: group.addons.length })}</span>
                    </h3>
                    <ul className="text-sm">
                      {group.addons.map((addon) => (
                        <li key={addon.id}>
                          {addon.href !== undefined ? (
                            <ExternalLink href={addon.href} className="flex min-h-7 items-center hover:text-lane-project">
                              {addon.name}
                            </ExternalLink>
                          ) : (
                            <span className="flex min-h-7 items-center">{addon.name}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="mt-12">
        <SourceLink file={SOURCE} />
      </div>
    </PageTransition>
  );
}
