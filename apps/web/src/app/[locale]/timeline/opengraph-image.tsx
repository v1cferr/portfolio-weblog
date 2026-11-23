import { type OgSection, renderSectionImage, sectionImageMetadata } from "@/lib/og-section";

// All four lanes: the timeline puts every kind of entry on one axis.
const SECTION: OgSection = { namespace: "Timeline", path: "/timeline", source: { path: "", name: "timeline" } };

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return sectionImageMetadata(params.locale, SECTION);
}

/** The timeline section card. */
export default async function TimelineImage({ params }: { params: Promise<{ locale: string }> }) {
  return renderSectionImage((await params).locale, SECTION);
}
