interface SiteConfig {
  mediaPlaceholders: boolean;
}

/** Presentation switches for the whole site. Content decisions belong in content/. */
export const siteConfig: SiteConfig = {
  /**
   * Show a reserved "photos coming" space on experiences, projects and studies
   * that have no images yet. Turn it off once the photos are in; a single
   * entity can opt out with `mediaPlaceholder: false` in its content file.
   */
  mediaPlaceholders: true,
};
