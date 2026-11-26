import { Badge } from "@workspace/ui/components/badge";
import { ArchiveIcon } from "lucide-react";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { CopyLink } from "@/components/anchor/copy-link";
import { ExternalLink } from "@/components/external-link";
import { InfoTip } from "@/components/info-tip";
import { formatPartialDate } from "@/lib/dates";
import type { RepoLanguages } from "@/lib/github";

import { describeLanguages, LanguageBar } from "./languages";

/** Stable anchor of the block (docs/guides/deep-links.md). */
export const LANGUAGES_ANCHOR = "languages";

/**
 * The repository's languages as GitHub lists them: its stacked bar and a
 * legend with each language's share, largest first. Where the numbers come
 * from and when they were taken sits behind the "i". An archived repository
 * says so with a badge.
 */
export async function RepoLanguagesSection({ data }: { data: RepoLanguages }) {
  const [t, locale] = await Promise.all([getTranslations("Projects"), getLocale()]);
  const languages = data.languages.map((language) => (language.other === true ? { ...language, name: t("otherLanguages") } : language));
  const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const link = (chunks: ReactNode) => (
    <ExternalLink href={data.repo.html_url} className="underline underline-offset-4">
      {chunks}
    </ExternalLink>
  );
  return (
    <section
      id={LANGUAGES_ANCHOR}
      data-anchor=""
      aria-labelledby={`${LANGUAGES_ANCHOR}-heading`}
      className="group/anchor scroll-mt-24 space-y-3"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 id={`${LANGUAGES_ANCHOR}-heading`} className="text-sm font-medium">
          {t("languages")}
        </h2>
        <InfoTip label={t("languagesInfoLabel")} align="start" className="-my-1">
          {data.fetchedAt !== undefined
            ? t.rich("languagesInfo", { link, date: formatPartialDate(data.fetchedAt.slice(0, 10), locale) })
            : t.rich("languagesInfoNoDate", { link })}
          {data.repo.archived && <> {t("archivedInfo")}</>}
        </InfoTip>
        <CopyLink id={LANGUAGES_ANCHOR} nameId={`${LANGUAGES_ANCHOR}-heading`} />
        {data.repo.archived && (
          <Badge variant="outline" className="ml-auto" data-testid="repo-archived">
            <ArchiveIcon aria-hidden />
            {t("archived")}
          </Badge>
        )}
      </div>
      <LanguageBar
        languages={languages}
        label={t("languagesBar", { list: describeLanguages(languages, locale) })}
        className="h-2 rounded-full"
      />
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" aria-label={t("languages")}>
        {languages.map((language) => (
          <li key={language.name} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: language.color }} />
            <span className="font-medium">{language.name}</span>
            <span className="text-muted-foreground tabular-nums">{percent.format(language.percent)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
