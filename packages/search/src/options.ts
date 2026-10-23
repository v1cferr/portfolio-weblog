/**
 * Index settings shared by whoever builds and whoever queries the index, so
 * the browser and the server never disagree. Safe to import client-side.
 */
export const SEARCH_FIELDS = ["title", "keywords", "text"] as const;
export const STORED_FIELDS = ["entityId", "type", "title", "url", "section", "locale", "excerpt"] as const;

export const searchOptions = {
  fields: [...SEARCH_FIELDS],
  storeFields: [...STORED_FIELDS],
  searchOptions: {
    boost: { title: 3, keywords: 2 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: "AND" as const,
  },
};

export type SearchEntityType = "experience" | "project" | "education" | "certification" | "post" | "technology";

/**
 * One public, citable unit of content. This is also the corpus a future
 * retrieval layer will chunk and embed (docs/architecture/ai-roadmap.md), so
 * every document carries where it came from.
 */
export interface SearchDocument {
  /** Unique per locale: `${type}:${entityId}:${locale}`. */
  id: string;
  entityId: string;
  type: SearchEntityType;
  /** Locale the text is written in (may differ from the index locale on fallback). */
  locale: string;
  /** Site section, e.g. "career". */
  section: string;
  title: string;
  /** Technology names, tags and organization names. */
  keywords: string;
  text: string;
  /** Short line for result lists. */
  excerpt: string;
  /** Locale-prefixed path of the page that shows this content. */
  url: string;
}
