import { type OgSection, renderSectionImage, sectionImageMetadata } from "@/lib/og-section";

// The now log spans every lane (career, projects, writing), so its card shows all four.
const SECTION: OgSection = { namespace: "Now", path: "/now", source: { path: "now" } };

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return sectionImageMetadata(params.locale, SECTION);
}

/** The now log card. */
export default async function NowImage({ params }: { params: Promise<{ locale: string }> }) {
  return renderSectionImage((await params).locale, SECTION);
}
