import { type Education, localize, ongoingStudies, selectCredentials } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowRightIcon, ArrowUpRightIcon, AwardIcon, BookOpenIcon, GraduationCapIcon, type LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ExternalLink } from "@/components/external-link";
import { SpineBranch } from "@/components/git-spine";
import { SectionHeading } from "@/components/page-header";
import { NAV_SECTION } from "@/components/page-transition";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";

interface Tile {
  key: string;
  href: string;
  icon: LucideIcon;
  kind: string;
  title: string;
  titleLocale?: string | undefined;
  issuer?: string | undefined;
  date?: string | undefined;
  verify?: string | undefined;
  ongoing?: boolean;
}

const studyIcon = (item: Education): LucideIcon => (item.kind === "degree" ? GraduationCapIcon : BookOpenIcon);

/**
 * The home page's "Learning" strip: the study in progress, if any, and up to
 * three credentials (featured certifications, then the latest completed
 * studies). No badge wall: one monochrome icon per tile and a mono date.
 */
export async function LearningStrip() {
  const [locale, t, education, kind] = await Promise.all([
    getLocale(),
    getTranslations("Home"),
    getTranslations("Education"),
    getTranslations("Kind"),
  ]);
  const content = getContent();
  const studies = content.getEducation();
  const issuer = (id: string) => content.getOrganization(id)?.name;

  const tiles: Tile[] = [
    ...ongoingStudies(studies)
      .slice(0, 1)
      .map((item): Tile => {
        const title = localize(item.title, locale);
        return {
          key: item.id,
          href: `/education#${item.id}`,
          icon: studyIcon(item),
          kind: education(`kind.${item.kind}`),
          title: title.value,
          titleLocale: title.locale,
          issuer: issuer(item.institution),
          date: item.start,
          ongoing: true,
        };
      }),
    ...selectCredentials({ education: studies, certifications: content.getCertifications() }).map((credential): Tile => {
      if (credential.kind === "certification") {
        const cert = credential.certification;
        return {
          key: cert.id,
          href: `/education#${cert.id}`,
          icon: AwardIcon,
          kind: kind("certification"),
          title: cert.name,
          issuer: issuer(cert.issuer),
          date: cert.issuedAt,
          verify: cert.credentialUrl,
        };
      }
      const item = credential.education;
      const title = localize(item.title, locale);
      return {
        key: item.id,
        href: `/education#${item.id}`,
        icon: studyIcon(item),
        kind: education(`kind.${item.kind}`),
        title: title.value,
        titleLocale: title.locale,
        issuer: issuer(item.institution),
        date: item.end ?? item.start,
      };
    }),
  ];
  if (tiles.length === 0) return null;

  return (
    <section aria-labelledby="learning" className="mb-16 max-w-3xl">
      <SectionHeading
        id="learning"
        icon={GraduationCapIcon}
        branch={<SpineBranch lane="study" />}
        action={
          <Link
            href="/education"
            transitionTypes={NAV_SECTION}
            className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:min-h-0"
          >
            {t("allStudies")} <ArrowRightIcon className="size-3.5" aria-hidden />
          </Link>
        }
      >
        {t("learning")}
      </SectionHeading>
      <ul aria-label={t("credentialsLabel")} className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
        {tiles.map((tile) => (
          <li key={tile.key} className="glass group relative flex gap-3 rounded-xl border p-4">
            <tile.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[0.7rem] tracking-wide text-lane-study uppercase">{tile.kind}</span>
                {tile.ongoing === true && (
                  <Badge variant="now" className="font-normal">
                    {t("ongoing")}
                  </Badge>
                )}
              </p>
              <h3 className="leading-snug font-semibold text-balance" lang={tile.titleLocale}>
                {/* The whole tile is the target; the verify link sits above it. */}
                <Link
                  href={tile.href}
                  className="after:absolute after:inset-0 after:rounded-xl group-hover:underline group-hover:underline-offset-4"
                >
                  {tile.title}
                </Link>
              </h3>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {tile.issuer !== undefined && <span>{tile.issuer}</span>}
                {tile.date !== undefined && (
                  <time dateTime={tile.date} className="font-mono text-xs tabular-nums">
                    {formatPartialDate(tile.date, locale)}
                  </time>
                )}
                {tile.verify !== undefined && (
                  <ExternalLink
                    href={tile.verify}
                    className="relative z-10 inline-flex min-h-11 items-center gap-0.5 font-mono text-xs underline underline-offset-4 hover:text-foreground sm:min-h-0"
                  >
                    {t("verify")} <span className="sr-only">{tile.title}</span>
                    <ArrowUpRightIcon className="size-3" aria-hidden />
                  </ExternalLink>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
