import "server-only";

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { findContentRoot } from "@workspace/content";

import { REPOSITORY_URL } from "./site";

/*
 * Where this build came from, for the footer: the commit (Vercel's
 * VERCEL_GIT_COMMIT_SHA, else `git rev-parse HEAD`) and the nixpkgs revision
 * pinned in flake.lock, the dev shell the site is built and tested with. Read
 * at build time; anything missing is simply left out.
 */
export interface BuildInfo {
  commit?: { sha: string; url: string };
  nixpkgs?: { rev: string; ref: string; date: string; url: string };
}

let cached: BuildInfo | undefined;

function commitSha(): string | undefined {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel !== undefined && fromVercel !== "") return fromVercel;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

interface FlakeLock {
  nodes?: { nixpkgs?: { locked?: { rev?: string; lastModified?: number }; original?: { ref?: string } } };
}

export function buildInfo(): BuildInfo {
  if (cached !== undefined) return cached;
  const info: BuildInfo = {};
  const sha = commitSha();
  if (sha !== undefined && /^[0-9a-f]{40}$/.test(sha)) info.commit = { sha, url: `${REPOSITORY_URL}/commit/${sha}` };
  try {
    const lock = JSON.parse(readFileSync(path.join(findContentRoot(), "..", "flake.lock"), "utf8")) as FlakeLock;
    const node = lock.nodes?.nixpkgs;
    const rev = node?.locked?.rev;
    const modified = node?.locked?.lastModified;
    if (rev !== undefined && modified !== undefined) {
      info.nixpkgs = {
        rev,
        ref: node?.original?.ref ?? "nixpkgs",
        date: new Date(modified * 1000).toISOString().slice(0, 10),
        url: `https://github.com/NixOS/nixpkgs/commit/${rev}`,
      };
    }
  } catch {
    // No flake.lock in this checkout: leave nixpkgs out.
  }
  cached = info;
  return info;
}
