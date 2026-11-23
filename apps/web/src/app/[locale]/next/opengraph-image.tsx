import { type OgSection, renderSectionImage, sectionImageMetadata } from "@/lib/og-section";

const SECTION: OgSection = { namespace: "Next", path: "/next", source: { path: "now/next.yaml", name: "next" }, lane: "project" };

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  return sectionImageMetadata(params.locale, SECTION);
}

/** The next plans card. */
export default async function NextImage({ params }: { params: Promise<{ locale: string }> }) {
  return renderSectionImage((await params).locale, SECTION);
}
