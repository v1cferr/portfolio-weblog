import { localize } from "@workspace/content";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { SITE_IMAGE_ALT } from "@/lib/metadata";
import { renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE_IMAGE_ALT;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** The site card: name, handle and headline, with all four lanes lit. */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const profile = getContent().getProfile();
  return renderOgImage({
    storePath: storePath("profile/profile.yaml", profile.handle).label,
    title: profile.name,
    subtitle: localize(profile.headline, locale).value,
    meta: `@${profile.handle}`,
    command: "whoami",
  });
}
