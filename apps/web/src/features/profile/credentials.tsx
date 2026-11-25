import { localize } from "@workspace/content";
import { ArrowRightIcon, AwardIcon, GraduationCapIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { SectionHeading } from "@/components/page-header";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";

/**
 * Degrees and featured certificates on the About page, newest first, each
 * linking to its entry on the Studies page. Everything comes from content:
 * nothing to write here when a new degree or certificate is added.
 */
export async function Credentials() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("About")]);
  const content = getContent();
  const degrees = content
    .getEducation()
    .filter((item) => item.kind === "degree" || item.state === "ongoing")
    .sort((a, b) => (b.end ?? b.start ?? "9999").localeCompare(a.end ?? a.start ?? "9999"));
  const certificates = content
    .getCertifications()
    .filter((cert) => cert.featured)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  if (degrees.length === 0 && certificates.length === 0) return null;

  return (
    <section aria-labelledby="credentials" data-testid="about-credentials">
      <SectionHeading id="credentials" icon={GraduationCapIcon}>
        {t("credentials")}
      </SectionHeading>
      <ul className="grid gap-3 sm:grid-cols-2">
        {degrees.map((item) => {
          const organization = content.getOrganization(item.institution);
          const title = localize(item.title, locale);
          const when = item.state === "ongoing" ? t("ongoing") : item.end !== undefined ? formatPartialDate(item.end, locale) : undefined;
          return (
            <li key={item.id}>
              <Link href={`/education#${item.id}`} className="glass glass-hover flex h-full gap-3 rounded-xl border p-4">
                {organization !== undefined && <OrganizationMark organization={organization} />}
                <span className="min-w-0 space-y-0.5">
                  <span className="block font-medium" lang={title.locale}>
                    {title.value}
                  </span>
                  <span className="block text-sm text-muted-foreground">{[organization?.name, when].filter(Boolean).join(" · ")}</span>
                </span>
              </Link>
            </li>
          );
        })}
        {certificates.map((cert) => {
          const organization = content.getOrganization(cert.issuer);
          return (
            <li key={cert.id}>
              <Link href={`/education#${cert.id}`} className="glass glass-hover flex h-full gap-3 rounded-xl border p-4">
                {organization !== undefined ? (
                  <OrganizationMark organization={organization} />
                ) : (
                  <AwardIcon className="mt-0.5 size-5 shrink-0 text-lane-study" aria-hidden />
                )}
                <span className="min-w-0 space-y-0.5">
                  <span className="block font-medium">{cert.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {[t("certificate"), organization?.name, formatPartialDate(cert.issuedAt, locale)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/education"
        className="group/link mt-3 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {t("allStudies")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
      </Link>
    </section>
  );
}
