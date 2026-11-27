import { localize, type LocalizedText, type WowRuleset } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@workspace/ui/components/empty";
import { BirdIcon, CameraIcon, ExternalLinkIcon, Gamepad2Icon, PuzzleIcon, SwordsIcon, UserRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { CopyLink } from "@/components/anchor/copy-link";
import { ExternalLink } from "@/components/external-link";
import { MediaGallery } from "@/components/media-gallery";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { SourceLink } from "@/components/source-link";
import type { Locale } from "@/i18n/routing";
import { type CharacterView, getCharacterViews, getPlayableNames } from "@/lib/blizzard";
import { anchorId } from "@/lib/anchors";
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

/** A character's anchor on /wow: game, name and realm (or surname), e.g. `wow-retail-viictororc-gallywix`. */
function characterId({ character }: CharacterView): string {
  return anchorId("wow", character.game, character.name, character.game === "forever" ? character.surname : character.realm);
}

async function CharacterCard({
  view,
  locale,
  syncedAt,
  names,
}: {
  view: CharacterView;
  locale: Locale;
  syncedAt: string | undefined;
  /** English class and race names to every locale, for characters shown from the file. */
  names: ReadonlyMap<string, LocalizedText>;
}) {
  const t = await getTranslations("Wow");
  const date = (day: string) => formatPartialDate(day, locale);
  const { character, live } = view;
  const fullName = character.game === "forever" ? `${character.name} ${character.surname}` : character.name;
  const level = live?.level ?? character.level;
  const race = live?.raceName !== undefined ? localize(live.raceName, locale) : undefined;
  const cls = live?.className !== undefined ? localize(live.className, locale) : undefined;
  const fromFile = (english: string | undefined) => {
    const name = english === undefined ? undefined : names.get(english);
    return name === undefined ? english : localize(name, locale).value;
  };
  const raceClass = [race?.value ?? fromFile(character.race), cls?.value ?? fromFile(character.class)].filter(Boolean).join(" ");
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
    <article id={characterId(view)} data-anchor="" className="group/anchor glass flex h-full min-w-0 gap-4 rounded-xl border p-4">
      {live?.renderUrl !== undefined ? (
        <Image src={live.renderUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-lg border bg-muted object-cover" />
      ) : (
        <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <UserRoundIcon className="size-6" />
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-1">
          <h3 id={`${characterId(view)}-name`} className="flex flex-1 flex-wrap items-center gap-2 font-medium">
            {fullName}
            {character.main && <Badge variant="now">{t("main")}</Badge>}
          </h3>
          <CopyLink id={characterId(view)} nameId={`${characterId(view)}-name`} />
        </div>
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

  const [views, addons, names] = await Promise.all([
    getCharacterViews(sortCharacters(wow.characters)),
    wow.addons === undefined ? undefined : getAddonList(wow.addons),
    getPlayableNames(),
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
        </EmptyHeader>
      </Empty>
    ) : (
      <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("charactersLabel", { game })}>
        {list.map((view) => (
          <li className="min-w-0" key={characterId(view)}>
            <CharacterCard view={view} locale={locale} syncedAt={wow.syncedAt} names={names} />
          </li>
        ))}
      </ul>
    );

  return (
    <PageTransition>
      <PageHeader source={{ path: SOURCE }} icon={Gamepad2Icon} title={t("title")} description={t("description")} />

      <div className="space-y-14">
        <section aria-labelledby="wow-forever">
          <SectionHeading id="wow-forever" icon={SwordsIcon} info={t("foreverNote")}>
            {t("forever")}
          </SectionHeading>
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
                  <li
                    key={wish.wowheadItem}
                    id={anchorId("wow-wish", wish.wowheadItem)}
                    data-anchor=""
                    className="group/anchor glass relative space-y-1 rounded-xl border p-4 pr-10"
                  >
                    <CopyLink id={anchorId("wow-wish", wish.wowheadItem)} name={name.value} className="absolute top-4 right-3" />
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
            <SectionHeading
              id="wow-addons"
              icon={PuzzleIcon}
              info={t.rich("addonsNote", {
                count: addons.total,
                nix: (chunks) => (
                  <ExternalLink href={wow.addons?.package} className="text-foreground underline underline-offset-4 hover:text-lane-project">
                    {chunks}
                  </ExternalLink>
                ),
              })}
            >
              {t("addons")}
            </SectionHeading>
            {addons.source === "snapshot" && <p className="mb-2 text-sm text-muted-foreground">{t("addonsSnapshot")}</p>}
            <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {addons.groups.map((group) => {
                const title = group.title === undefined ? undefined : localize(group.title, locale);
                return (
                  <section key={group.id} aria-labelledby={`addons-${group.id}`} className="group/anchor">
                    <div className="mb-2 flex items-center gap-1 border-b pb-1.5">
                      <h3
                        id={`addons-${group.id}`}
                        data-anchor=""
                        className="flex flex-1 items-baseline justify-between gap-3 font-mono text-xs tracking-wide text-muted-foreground uppercase"
                      >
                        <span lang={title?.locale}>{title?.value ?? t("otherGroup")}</span>
                        <span className="tabular-nums normal-case">{t("addonCount", { count: group.addons.length })}</span>
                      </h3>
                      <CopyLink id={`addons-${group.id}`} name={title?.value ?? t("otherGroup")} />
                    </div>
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

        {/* Screenshots arrive over time: with none, there is no section at all. */}
        {wow.screenshots.length > 0 && (
          <section aria-labelledby="wow-screenshots">
            <SectionHeading id="wow-screenshots" icon={CameraIcon}>
              {t("screenshots")}
            </SectionHeading>
            <MediaGallery id="wow-screenshots" media={wow.screenshots} />
          </section>
        )}
      </div>

      <div className="mt-12">
        <SourceLink file={SOURCE} />
      </div>
    </PageTransition>
  );
}
