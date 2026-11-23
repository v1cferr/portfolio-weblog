import { type OgSection, renderSectionImage, sectionImageMetadata } from "@/lib/og-section";

const SECTION: OgSection = { namespace: "Wow", path: "/wow", source: { path: "games/wow.yaml" } };

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return sectionImageMetadata(params.locale, SECTION);
}

/** The World of Warcraft page card. */
export default async function WowImage({ params }: { params: Promise<{ locale: string }> }) {
  return renderSectionImage((await params).locale, SECTION);
}
