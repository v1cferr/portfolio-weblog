import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { checkMedia, loadContent } from "../src";
import { makeContent, project } from "./fixture";

function publicDirWith(...files: string[]) {
  const dir = mkdtempSync(path.join(tmpdir(), "public-"));
  for (const file of files) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), "x");
  }
  return dir;
}

const withMedia = (src: string) =>
  loadContent(makeContent({ "projects/hub.yaml": project({ media: [{ src, alt: { "en-us": "Screenshot" } }] }) })).content;

describe("checkMedia", () => {
  it("accepts an existing image without metadata", async () => {
    const issues = await checkMedia(withMedia("/shots/hub.webp"), publicDirWith("shots/hub.webp"), () => Promise.resolve({}));
    expect(issues).toEqual([]);
  });

  it("rejects a missing file", async () => {
    const issues = await checkMedia(withMedia("/shots/missing.webp"), publicDirWith(), () => Promise.resolve({}));
    expect(issues[0]?.message).toContain("does not exist");
  });

  it("rejects images that still carry EXIF, XMP or IPTC metadata", async () => {
    const issues = await checkMedia(withMedia("/shots/hub.jpg"), publicDirWith("shots/hub.jpg"), () =>
      Promise.resolve({ exif: Buffer.from("GPS") })
    );
    expect(issues[0]?.message).toContain("still has EXIF/XMP/IPTC metadata");
  });

  it("requires alt text and an image path", () => {
    const { issues } = loadContent(makeContent({ "projects/hub.yaml": project({ media: [{ src: "/x.gif" }] }) }));
    expect(issues.map((issue) => issue.message).join()).toMatch(/alt.*|src is a path/);
  });
});
