/** One image in a lightbox gallery, serializable from a server component. */
export interface LightboxItem {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** The language of `alt` when it is a fallback from another locale. */
  altLang?: string;
  caption?: string;
  captionLang?: string;
  /** A document: the full view is the file itself, unoptimized, so small text stays sharp. */
  document?: boolean;
  /** When the photo was taken: an ISO date for `<time>` and its localized label. */
  date?: { iso: string; label: string };
}

/** The search parameter that deep-links an open image: `?photo=<gallery>-<n>`, n from 1. */
export const PHOTO_PARAM = "photo";

/** A gallery id is part of a URL and a layout id, so it keeps to word characters and dashes. */
export function galleryId(value: string) {
  return value.replace(/[^\w-]/g, "_");
}

export function photoValue(gallery: string, index: number) {
  return `${gallery}-${String(index + 1)}`;
}

/** The zero-based index `value` points at in this gallery, or null if it names another gallery or no image. */
export function parsePhoto(value: string | null, gallery: string, count: number): number | null {
  if (value?.startsWith(`${gallery}-`) !== true) return null;
  const position = value.slice(gallery.length + 1);
  if (!/^[1-9]\d*$/.test(position)) return null;
  const index = Number(position) - 1;
  return index < count ? index : null;
}

/** The current URL with the photo parameter set to `value`, or removed when it is null. */
export function urlWithPhoto(value: string | null) {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(PHOTO_PARAM);
  else url.searchParams.set(PHOTO_PARAM, value);
  return url.toString();
}
