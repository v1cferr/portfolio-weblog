export type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fills keys missing from `partial` with the fallback's strings, recursively. */
export function withFallback(fallback: Messages, partial: Messages): Messages {
  const merged: Messages = { ...fallback };
  for (const [key, value] of Object.entries(partial)) {
    const base = merged[key];
    merged[key] = isPlainObject(base) && isPlainObject(value) ? withFallback(base, value) : value;
  }
  return merged;
}
