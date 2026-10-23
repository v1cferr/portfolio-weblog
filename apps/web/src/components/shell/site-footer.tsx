import { getLocale, getTranslations } from "next-intl/server";

import { SocialLinks } from "@/components/social-links";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { REPOSITORY_URL } from "@/lib/site";

export async function SiteFooter() {
  const [t, nav, locale] = await Promise.all([getTranslations("Footer"), getTranslations("Nav"), getLocale()]);
  const profile = getContent().getProfile();
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{profile.name}</p>
          <p>{t("builtFrom")}</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>
            <Link className="hover:text-foreground" href="/setup">
              {nav("setup")}
            </Link>
          </li>
          <li>
            <a className="hover:text-foreground" href={`/${locale}/weblog/rss.xml`}>
              {t("rss")}
            </a>
          </li>
          <li>
            <a className="hover:text-foreground" href={REPOSITORY_URL}>
              {t("repository")}
            </a>
          </li>
        </ul>
        <SocialLinks links={profile.links} label={t("elsewhere")} size="sm" />
      </div>
    </footer>
  );
}
