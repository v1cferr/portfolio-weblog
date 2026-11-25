import { HashIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";

/**
 * A few counts for the About page, all derived from content at build time,
 * so they never go stale and never need writing.
 */
export async function AboutNumbers() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("About")]);
  const content = getContent();
  const experiences = content.getExperiences();
  const firstYear = experiences
    .map((experience) => experience.positions[0]?.start)
    .filter((start): start is string => start !== undefined)
    .sort()[0]
    ?.slice(0, 4);
  const stats = [
    { value: experiences.length, label: t("numbers.experiences"), href: "/career" },
    { value: content.getProjects().length, label: t("numbers.projects"), href: "/projects" },
    { value: content.getPosts(locale).length, label: t("numbers.posts"), href: "/weblog" },
    { value: content.getCertifications().length, label: t("numbers.certificates"), href: "/education#certifications" },
  ].filter((stat) => stat.value > 0);
  if (stats.length === 0) return null;

  return (
    <section aria-labelledby="numbers" data-testid="about-numbers">
      <h2 id="numbers" className="mb-3 flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        <HashIcon className="size-3.5" aria-hidden />
        {t("numbers.title")}
      </h2>
      <dl className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.href} className="glass rounded-xl border">
            <Link href={stat.href} className="flex flex-col-reverse gap-0.5 p-3 hover:text-foreground">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums">{stat.value}</dd>
            </Link>
          </div>
        ))}
      </dl>
      {firstYear !== undefined && <p className="mt-2 text-xs text-muted-foreground">{t("numbers.since", { year: firstYear })}</p>}
    </section>
  );
}
