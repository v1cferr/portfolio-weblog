import { getContent } from "@/lib/content";
import { ownerTitle } from "@/lib/current-role";
import { siteImageAlt } from "@/lib/metadata";
import { ogImageMetadata, ogLocale, renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return ogImageMetadata(await siteImageAlt(ogLocale(params.locale)));
}

/** The site card: name, handle and headline, with all four lanes lit. */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = ogLocale((await params).locale);
  const profile = getContent().getProfile();
  return renderOgImage({
    storePath: storePath("profile/profile.yaml", profile.handle).label,
    title: profile.name,
    subtitle: ownerTitle(locale).value,
    meta: `@${profile.handle}`,
    command: "whoami",
  });
}
