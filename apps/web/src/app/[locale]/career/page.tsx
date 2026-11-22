import { BriefcaseBusinessIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/page-transition";
import { PageHeader } from "@/components/page-header";
import { CareerTimeline } from "@/features/career/career-timeline";
import { getContent } from "@/lib/content";
import { pageAlternates } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Career");
  return { title: t("title"), description: t("description"), alternates: pageAlternates(locale, "/career") };
}

export default async function CareerPage() {
  const t = await getTranslations("Career");
  const experiences = getContent().getExperiences();
  return (
    <PageTransition>
      <PageHeader source={{ path: "experiences" }} icon={BriefcaseBusinessIcon} title={t("title")} description={t("description")} />
      {experiences.length === 0 ? <p className="text-muted-foreground">{t("empty")}</p> : <CareerTimeline experiences={experiences} />}
    </PageTransition>
  );
}
