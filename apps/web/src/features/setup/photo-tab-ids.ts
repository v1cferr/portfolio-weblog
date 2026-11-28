/*
 * The ids of the setup photo tabs, shared by the page (a server component)
 * and the tabs (a client component).
 */

/** The photos section's heading. */
export const PHOTOS_SECTION = "setup-photos";

/** The fragment that opens a tab: `#setup-photos-<value>`. */
export const photoTabAnchor = (value: string) => `${PHOTOS_SECTION}-${value}`;

/** The lightbox gallery of a tab: `?photo=setup-<value>-<n>`. */
export const photoTabGallery = (value: string) => `setup-${value}`;
