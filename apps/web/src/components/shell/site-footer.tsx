import { getLocale, getTranslations } from "next-intl/server";

import { NAV_SECTION } from "@/components/page-transition";
import { SocialLinks } from "@/components/social-links";
import { Link } from "@/i18n/navigation";
import { NixosLogo } from "@/components/nixos-logo";
import { buildInfo } from "@/lib/build-info";
import { getContent } from "@/lib/content";
import { REPOSITORY_URL } from "@/lib/site";
import { ExternalLink } from "@/components/external-link";

export async function SiteFooter() {
  const [t, nav, locale] = await Promise.all([getTranslations("Footer"), getTranslations("Nav"), getLocale()]);
  const profile = getContent().getProfile();
  const build = buildInfo();
  return (
    // Room at the bottom on phones, so the Ask launcher floating in the corner never covers the last line.
    <footer className="mt-24 border-t max-sm:pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{profile.name}</p>
          <p>{t("builtFrom")}</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>
            <Link className="hover:text-foreground" href="/now" transitionTypes={NAV_SECTION}>
              {t("now")}
            </Link>
          </li>
          <li>
            <Link className="hover:text-foreground" href="/next" transitionTypes={NAV_SECTION}>
              {t("next")}
            </Link>
          </li>
          <li>
            <Link className="hover:text-foreground" href="/decisions" transitionTypes={NAV_SECTION}>
              {t("decisions")}
            </Link>
          </li>
          <li>
            <Link className="hover:text-foreground" href="/setup" transitionTypes={NAV_SECTION}>
              {nav("setup")}
            </Link>
          </li>
          <li>
            <Link className="hover:text-foreground" href="/weblog/how-this-site-is-built" transitionTypes={NAV_SECTION}>
              {t("howBuilt")}
            </Link>
          </li>
          <li>
            <a className="hover:text-foreground" href={`/${locale}/weblog/rss.xml`}>
              {t("rss")}
            </a>
          </li>
          <li>
            <ExternalLink className="hover:text-foreground" href={REPOSITORY_URL}>
              {t("repository")}
            </ExternalLink>
          </li>
        </ul>
        <SocialLinks links={profile.links} label={t("elsewhere")} size="sm" />
      </div>
      {build.commit !== undefined && build.nixpkgs !== undefined && (
        <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 pb-2 font-mono text-xs text-muted-foreground sm:px-6">
          <NixosLogo className="size-3.5" />
          <span>
            {t.rich("provenance", {
              sha: build.commit.sha.slice(0, 7),
              rev: build.nixpkgs.rev.slice(0, 7),
              ref: build.nixpkgs.ref,
              date: build.nixpkgs.date,
              commit: (chunks) => (
                <ExternalLink className="underline underline-offset-4 hover:text-foreground" href={build.commit?.url}>
                  {chunks}
                </ExternalLink>
              ),
              nixpkgs: (chunks) => (
                <ExternalLink className="underline underline-offset-4 hover:text-foreground" href={build.nixpkgs?.url}>
                  {chunks}
                </ExternalLink>
              ),
            })}
          </span>
        </p>
      )}
      {/* Attribution the NixOS logo's licence asks for (it appears on the home page; see components/nixos-logo.tsx). */}
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
        {t.rich("nixosCredit", {
          license: (chunks) => (
            <ExternalLink
              className="underline underline-offset-4 hover:text-foreground"
              href="https://creativecommons.org/licenses/by/4.0/"
            >
              {chunks}
            </ExternalLink>
          ),
          source: (chunks) => (
            <ExternalLink className="underline underline-offset-4 hover:text-foreground" href="https://nixos.org/branding">
              {chunks}
            </ExternalLink>
          ),
        })}
      </p>
    </footer>
  );
}
