import { type OgSection, renderSectionImage, sectionImageMetadata } from "@/lib/og-section";

const SECTION: OgSection = { namespace: "Colophon", path: "/colophon", source: { path: "pages/colophon" } };

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return sectionImageMetadata(params.locale, SECTION);
}

/** The colophon's card. */
export default async function ColophonImage({ params }: { params: Promise<{ locale: string }> }) {
  return renderSectionImage((await params).locale, SECTION);
}
