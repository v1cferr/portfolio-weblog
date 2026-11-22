import { buildSearchDocuments } from "@workspace/search";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";

// Built once per locale at build time and served as a static file: search
// needs no server at request time, and only public content is ever included.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: RouteContext<"/api/search/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response("Unknown locale", { status: 404 });
  return Response.json(buildSearchDocuments(getContent(), locale));
}
