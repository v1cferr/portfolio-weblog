import { type OgSection, renderSectionImage, sectionImageMetadata } from "@/lib/og-section";

const SECTION: OgSection = { namespace: "Tattoos", path: "/tattoos", source: { path: "profile/tattoos.yaml" } };

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return sectionImageMetadata(params.locale, SECTION);
}

/** The tattoos page card. */
export default async function TattoosImage({ params }: { params: Promise<{ locale: string }> }) {
  return renderSectionImage((await params).locale, SECTION);
}
