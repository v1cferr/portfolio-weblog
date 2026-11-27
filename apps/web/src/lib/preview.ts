/**
 * Content in `review` shows on Vercel preview deployments, which sit behind
 * deployment protection, so the owner can read it in place before approving it
 * (ADR 0019). `CONTENT_PREVIEW=1` does the same for a local build and the e2e
 * suite. Production never shows it, whatever the variables say.
 */
export const SHOWS_REVIEW =
  process.env.VERCEL_ENV !== "production" && (process.env.VERCEL_ENV === "preview" || process.env.CONTENT_PREVIEW === "1");
