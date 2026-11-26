import { localize } from "@workspace/content";
import { ScrollTextIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Morph } from "@/components/morph";
import { PageHeader } from "@/components/page-header";
import { NAV_FORWARD, PageTransition } from "@/components/page-transition";
import { DecisionMeta } from "@/features/decisions/decision-meta";
import { Link } from "@/i18n/navigation";
import { decisionPath } from "@/lib/decision-links";
import { getDecisions } from "@/lib/decisions";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph, siteOpenGraphImages } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Decisions");
  return {
    title: t("title"),
    description: `${t("description")} ${t("descriptionInfo")}`,
    alternates: pageAlternates(locale, "/decisions"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/decisions"), images: await siteOpenGraphImages(locale) },
  };
}

/** The decision log: every architecture decision record, newest first, with why it matters. */
export default async function DecisionsPage() {
  const locale = await getLocale();
  const t = await getTranslations("Decisions");
  const decisions = getDecisions();

  return (
    <PageTransition>
      <PageHeader
        source={{ path: "../docs/decisions", name: "decisions" }}
        icon={ScrollTextIcon}
        title={t("title")}
        description={t("description")}
        info={t("descriptionInfo")}
      />

      <ol aria-label={t("list")} className="max-w-3xl space-y-4">
        {decisions.map((decision) => {
          const why = decision.why === undefined ? undefined : localize(decision.why, locale);
          return (
            <li key={decision.number} className="glass glass-hover space-y-3 rounded-2xl border p-5 sm:p-6">
              <DecisionMeta decision={decision} />
              <h2 className="font-display text-xl leading-snug font-semibold tracking-tight text-balance">
                <Morph kind="decision" id={decision.number}>
                  <Link
                    href={decisionPath(decision.number)}
                    transitionTypes={NAV_FORWARD}
                    className="w-fit underline-offset-4 hover:underline"
                    lang="en-us"
                  >
                    {decision.title}
                  </Link>
                </Morph>
              </h2>
              {why !== undefined && (
                <p className="leading-relaxed text-pretty text-muted-foreground" lang={why.locale}>
                  {why.value}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </PageTransition>
  );
}
