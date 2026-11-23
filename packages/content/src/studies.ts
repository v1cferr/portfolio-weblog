import { upperBound } from "./dates";
import type { Certification, Education } from "./schemas";

/*
 * What the home page's "Learning" strip shows, kept out of the page so the
 * rules can be tested: the study in progress, and a few credentials.
 */

export type Credential = { kind: "certification"; certification: Certification } | { kind: "education"; education: Education };

/** Education kinds that group together on the Studies page, in their order there. */
export const STUDY_GROUPS = {
  degrees: ["degree"],
  courses: ["technical", "bootcamp", "course", "self-study"],
} as const satisfies Record<string, readonly Education["kind"][]>;

const byDateDesc = (a: string | undefined, b: string | undefined) => (b ?? "").localeCompare(a ?? "");

/** "YYYY-MM-DD" of a date, in UTC. */
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** A certification that has an expiry date, and it has passed. */
export function isExpired(certification: Certification, today: Date): boolean {
  return certification.expiresAt !== undefined && upperBound(certification.expiresAt) < isoDay(today);
}

/** The studies in progress, the most recently started first. */
export function ongoingStudies(education: readonly Education[]): Education[] {
  return education.filter((item) => item.state === "ongoing").sort((a, b) => byDateDesc(a.start, b.start));
}

/**
 * Up to `limit` credentials: the featured certifications that have not
 * expired, newest first, then, while there is room, the completed studies
 * that ended most recently. Unfeatured certifications stay on the Studies page,
 * and a study is skipped when its featured certificate already stands for it.
 */
export function selectCredentials(
  { education, certifications }: { education: readonly Education[]; certifications: readonly Certification[] },
  { limit = 3, today = new Date() }: { limit?: number; today?: Date } = {}
): Credential[] {
  const shown = certifications
    .filter((certification) => certification.featured && !isExpired(certification, today))
    .sort((a, b) => byDateDesc(a.issuedAt, b.issuedAt));
  const featured = shown.map((certification): Credential => ({ kind: "certification", certification }));
  // A study whose certificate is already shown (same issuer, same month) would appear twice.
  const certified = new Set(shown.map((certification) => `${certification.issuer}@${certification.issuedAt}`));
  const completed = education
    .filter((item) => item.state === "completed")
    .filter((item) => item.end === undefined || !certified.has(`${item.institution}@${item.end}`))
    .sort((a, b) => byDateDesc(a.end ?? a.start, b.end ?? b.start))
    .map((item): Credential => ({ kind: "education", education: item }));
  return [...featured, ...completed].slice(0, Math.max(0, limit));
}
