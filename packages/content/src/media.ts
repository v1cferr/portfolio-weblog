import { existsSync } from "node:fs";
import path from "node:path";

import type { ContentIssue } from "./loaders/errors";
import type { RawContent } from "./loaders/load";

export interface MediaReference {
  src: string;
  width: number;
  height: number;
  file: string;
}

/** Every image referenced by content, with the file that references it. */
export function collectMedia(content: RawContent): MediaReference[] {
  const sources = [...content.experiences, ...content.projects, ...content.education];
  const media = sources.flatMap(({ value, file }) => value.media.map(({ src, width, height }) => ({ src, width, height, file })));
  const setup = content.setup;
  return setup === undefined
    ? media
    : [...media, ...setup.value.photos.map(({ src, width, height }) => ({ src, width, height, file: setup.file }))];
}

/**
 * Checks that each referenced image exists under `publicDir`, has the size
 * the content states, and carries no metadata. EXIF can hold GPS coordinates and device details; v1 published
 * geotagged photos, so this is enforced rather than left to habit.
 * `readMetadata` is injected so the content package does not depend on an
 * image library at runtime.
 */
export async function checkMedia(
  content: RawContent,
  publicDir: string,
  readMetadata: (file: string) => Promise<{ width?: number; height?: number; exif?: unknown; xmp?: unknown; iptc?: unknown }>
): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = [];
  for (const { src, width, height, file } of collectMedia(content)) {
    const absolute = path.join(publicDir, src);
    if (!existsSync(absolute)) {
      issues.push({ file, message: `media "${src}" does not exist under apps/web/public` });
      continue;
    }
    const metadata = await readMetadata(absolute);
    if (metadata.exif !== undefined || metadata.xmp !== undefined || metadata.iptc !== undefined) {
      issues.push({ file, message: `media "${src}" still has EXIF/XMP/IPTC metadata; run pnpm media:add to strip it` });
    }
    if (metadata.width !== width || metadata.height !== height) {
      issues.push({
        file,
        message: `media "${src}" is ${String(metadata.width)}x${String(metadata.height)}, but the content says ${String(width)}x${String(height)}`,
      });
    }
  }
  const cv = content.profile?.value.cv;
  if (cv !== undefined && !existsSync(path.join(publicDir, cv))) {
    issues.push({ file: content.profile?.file ?? "profile/profile.yaml", message: `cv "${cv}" does not exist under apps/web/public` });
  }
  return issues;
}
