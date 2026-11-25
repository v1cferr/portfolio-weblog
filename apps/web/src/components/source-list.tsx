import { localize, type Source } from "@workspace/content";
import { ArchiveIcon, ExternalLinkIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ExternalLink } from "@/components/external-link";
import { InfoTip } from "@/components/info-tip";

/**
 * The public documents behind a page, as numbered references: title,
 * publisher, year and place in the document, with an archived copy when the
 * original may move. A line under the heading keeps an organization's facts
 * apart from the owner's own contribution.
 */
export async function SourceList({ sources }: { sources: readonly Source[] }) {
  if (sources.length === 0) return null;
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Common")]);
  return (
    <section aria-labelledby="sources" className="space-y-3">
      <div className="flex items-center gap-1">
        <h2 id="sources" className="text-xl font-semibold">
          {t("sources")}
        </h2>
        <InfoTip align="start">{t("sourcesNote")}</InfoTip>
      </div>
      <ol className="list-decimal space-y-2 pl-6 text-sm marker:font-mono marker:text-muted-foreground">
        {sources.map((source) => {
          const note = source.note && localize(source.note, locale);
          return (
            <li key={source.url} className="pl-1">
              <ExternalLink
                href={source.url}
                className="group/link inline-flex items-baseline gap-1 font-medium underline underline-offset-4 hover:text-foreground"
              >
                {source.title}
                <ExternalLinkIcon className="icon-out size-3 shrink-0 self-center" aria-hidden />
              </ExternalLink>
              <span className="text-muted-foreground">
                {[source.publisher, source.year?.toString(), source.page].filter(Boolean).map((part) => ` · ${part ?? ""}`)}
              </span>
              {source.archived !== undefined && (
                <>
                  {" · "}
                  <ExternalLink
                    href={source.archived}
                    className="inline-flex items-center gap-1 text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    <ArchiveIcon className="size-3" aria-hidden />
                    {t("archived")}
                  </ExternalLink>
                </>
              )}
              {note && (
                <p className="text-muted-foreground" lang={note.locale}>
                  {note.value}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
