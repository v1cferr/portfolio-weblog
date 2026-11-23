import { type OgSection, renderSectionImage, sectionImageMetadata } from "@/lib/og-section";

const SECTION: OgSection = {
  namespace: "About",
  path: "/about",
  source: { path: "profile/profile.yaml", name: "profile" },
};

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return sectionImageMetadata(params.locale, SECTION);
}

/** The about page card. */
export default async function AboutImage({ params }: { params: Promise<{ locale: string }> }) {
  return renderSectionImage((await params).locale, SECTION);
}
