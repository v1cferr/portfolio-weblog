/*
 * Deep links: every shareable element on a page carries a stable id, so a URL
 * fragment (`/pt-br/setup#mousepad-redragon-alianca`) can point at it. Ids come
 * from content ids, never from translated text, so a link works in every
 * locale. See docs/guides/deep-links.md.
 */

/**
 * Lowercase kebab-case ASCII: accents dropped ("Aliança" → "alianca"), any run
 * of other characters turned into one hyphen, none at the ends.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Joins the parts of an anchor id (`anchorId("now", "2026-11-20")` → `now-2026-11-20`). */
export function anchorId(...parts: (string | number | undefined)[]): string {
  return parts
    .filter((part): part is string | number => part !== undefined && part !== "")
    .map((part) => slugify(String(part)))
    .filter((part) => part !== "")
    .join("-");
}
