import "server-only";

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { findContentRoot } from "@workspace/content";

import { nixBase32 } from "./nix-base32";

/*
 * Labels in the shape of a Nix store path (/nix/store/<hash>-<name>), for the
 * page eyebrows. The hash is real: SHA-256 over the content files a page is
 * built from (relative paths and bytes, in order), truncated to 160 bits and
 * written in Nix's base32 alphabet, like a store path's 32 characters. Change
 * a file and the hash changes, as with a derivation. Computed at build time.
 */

function files(absolute: string): string[] {
  if (statSync(absolute).isFile()) return [absolute];
  return readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .flatMap((entry) => files(path.join(absolute, entry.name)))
    .sort();
}

const cache = new Map<string, string>();

/** The store-path label for a path under content/ ("experiences", "profile/setup.yaml", "" for all). */
export function storePath(contentPath: string, name?: string): { label: string; hash: string } {
  const key = `${contentPath}\0${name ?? ""}`;
  const root = findContentRoot();
  let hash = cache.get(key);
  if (hash === undefined) {
    const digest = createHash("sha256");
    for (const file of files(path.join(root, contentPath))) {
      digest.update(path.relative(root, file));
      digest.update("\0");
      digest.update(readFileSync(file));
    }
    hash = nixBase32(digest.digest().subarray(0, 20));
    cache.set(key, hash);
  }
  const label = name ?? (path.basename(contentPath).replace(/\.[a-z]+$/, "") || "content");
  return { label: `/nix/store/${hash}-${label}`, hash };
}
