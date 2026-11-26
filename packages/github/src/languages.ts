import { z } from "zod";

import { githubGet, type GitHubRequestOptions } from "./http";

/** GET /repos/{owner}/{repo}/languages: bytes of code per language, as GitHub's linguist counts them. */
export const RepoLanguages = z.record(z.string().min(1), z.number().int().nonnegative());
export type RepoLanguages = z.infer<typeof RepoLanguages>;

export type LanguagesResult =
  | {
      ok: true;
      languages: RepoLanguages;
      /** When GitHub produced this answer (its `Date` header), so a cached copy still tells its age. */
      fetchedAt?: string | undefined;
    }
  | { ok: false; error: string; status?: number };

/** `owner/repo`, the way content files name a repository. */
const FULL_NAME = /^[\w.-]+\/[\w.-]+$/;

/**
 * Languages of one repository. A private, deleted or renamed repository
 * answers 404 (403 for some private ones); like every other failure it comes
 * back as `ok: false` with the status, never thrown.
 */
export async function fetchRepoLanguages(fullName: string, options: GitHubRequestOptions = {}): Promise<LanguagesResult> {
  if (!FULL_NAME.test(fullName)) return { ok: false, error: `not an owner/repo name: ${fullName}` };
  const [owner = "", repo = ""] = fullName.split("/");
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;
  const result = await githubGet(url, options);
  if (!result.ok) return result;
  let body: unknown;
  try {
    body = await result.response.json();
  } catch {
    return { ok: false, error: "response is not JSON" };
  }
  const parsed = RepoLanguages.safeParse(body);
  if (!parsed.success) return { ok: false, error: "unexpected response shape" };
  const date = result.response.headers.get("date");
  const fetchedAt = date !== null && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : undefined;
  return { ok: true, languages: parsed.data, fetchedAt };
}

/** One slice of the language bar. */
export interface LanguageShare {
  name: string;
  bytes: number;
  /** Share of all bytes, 0–100, one decimal. */
  percent: number;
  /** True for the slice that gathers the languages under the threshold. */
  other?: true;
}

export interface LanguageShareOptions {
  /** Languages below this share (in %) are gathered into one "other" slice. Defaults to 1. */
  threshold?: number;
  /** Name of the gathered slice; the UI localizes it. Defaults to "Other". */
  otherName?: string;
}

const oneDecimal = (value: number) => Math.round(value * 10) / 10;

/**
 * Bytes per language → shares of the total, largest first, as GitHub draws its
 * bar. Languages under the threshold are gathered at the end into one "other"
 * slice, the way GitHub does; a single small language keeps its own name,
 * since gathering one item hides it for nothing. An empty or all-zero map
 * yields no shares.
 */
export function languageShares(languages: RepoLanguages, options: LanguageShareOptions = {}): LanguageShare[] {
  const { threshold = 1, otherName = "Other" } = options;
  const entries = Object.entries(languages).filter(([, bytes]) => bytes > 0);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) return [];
  const all = entries
    .map(([name, bytes]) => ({ name, bytes, share: (bytes / total) * 100 }))
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
  const major = all.filter((item) => item.share >= threshold);
  const minor = all.filter((item) => item.share < threshold);
  const shares: LanguageShare[] = (minor.length > 1 ? major : all).map(({ name, bytes, share }) => ({
    name,
    bytes,
    percent: oneDecimal(share),
  }));
  if (minor.length > 1) {
    const bytes = minor.reduce((sum, item) => sum + item.bytes, 0);
    shares.push({ name: otherName, bytes, percent: oneDecimal((bytes / total) * 100), other: true });
  }
  return shares;
}
