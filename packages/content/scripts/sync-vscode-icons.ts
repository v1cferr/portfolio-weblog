/**
 * Downloads the official Marketplace icon of every VS Code extension on
 * /setup (content/profile/setup.yaml `vscodeExtensions`):
 *
 *   pnpm vscode:icons
 *
 * One query to the Marketplace's public gallery API asks for the latest
 * version of every extension and its `Icons.Default` asset. Each icon is
 * fitted into a VSCODE_ICON_SIZE square (transparent padding, never
 * enlarged past the square), written as WebP without metadata to
 * apps/web/public/setup/vscode/<id>.webp, and the extension gets
 * `marketplaceIcon: true` in the YAML. An extension the Marketplace does not
 * know, or that ships no icon, loses the flag and its file, and the page shows
 * its `icon` logo instead. Extensions with a `url` live outside the
 * Marketplace and are skipped. Icons of extensions no longer listed are
 * removed.
 *
 * The YAML is edited line by line (each extension is a one-line flow map) so
 * the rest of the file keeps its formatting; the result is checked against
 * the schema before it is written.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { parse } from "yaml";

import { findContentRoot, Setup, VSCODE_ICON_SIZE, vscodeExtensionIcon } from "../src";

const QUERY_URL = "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery";
const ICON_ASSET = "Microsoft.VisualStudio.Services.Icons.Default";
/** IncludeVersions | IncludeFiles | IncludeLatestVersionOnly: the latest version's files, nothing else. */
const FLAGS = 0x1 | 0x2 | 0x200;
/** ExtensionName: matches `publisher.name`. */
const FILTER_BY_NAME = 7;
/** Downloads in flight at once; the gallery CDN is fast, this just keeps it polite. */
const CONCURRENCY = 8;

interface GalleryExtension {
  extensionName: string;
  publisher: { publisherName: string };
  versions: { files?: { assetType: string; source: string }[] }[];
}

const root = findContentRoot();
const yamlFile = path.join(root, "profile", "setup.yaml");
const publicDir = path.join(root, "..", "apps", "web", "public");
const iconDir = path.join(publicDir, path.dirname(vscodeExtensionIcon("x.y")));

const setup = Setup.parse(parse(readFileSync(yamlFile, "utf8")));
const extensions = (setup.vscodeExtensions?.groups ?? []).flatMap((group) => group.items);
const onMarketplace = extensions.filter((extension) => extension.url === undefined).map((extension) => extension.id);
if (onMarketplace.length === 0) {
  console.error("No VS Code extensions in content/profile/setup.yaml; nothing to do.");
  process.exit(1);
}

const response = await fetch(QUERY_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json;api-version=7.2-preview.1" },
  body: JSON.stringify({
    filters: [
      {
        criteria: onMarketplace.map((id) => ({ filterType: FILTER_BY_NAME, value: id })),
        pageNumber: 1,
        pageSize: onMarketplace.length,
      },
    ],
    flags: FLAGS,
  }),
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok) {
  console.error(`The Marketplace answered ${String(response.status)}; nothing written.`);
  process.exit(1);
}
const body = (await response.json()) as { results: { extensions: GalleryExtension[] }[] };

/** Icon URL per lowercase `publisher.name`; any platform's latest version will do, they share the icon. */
const iconUrls = new Map<string, string>();
for (const extension of body.results[0]?.extensions ?? []) {
  const id = `${extension.publisher.publisherName}.${extension.extensionName}`.toLowerCase();
  const icon = extension.versions.flatMap((version) => version.files ?? []).find((file) => file.assetType === ICON_ASSET);
  if (icon !== undefined) iconUrls.set(id, icon.source);
}

mkdirSync(iconDir, { recursive: true });
const withIcon = new Set<string>();
const failed: string[] = [];
const queue = onMarketplace.filter((id) => iconUrls.has(id));
async function worker() {
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    try {
      const download = await fetch(iconUrls.get(id) ?? "", { signal: AbortSignal.timeout(15_000) });
      if (!download.ok) throw new Error(`HTTP ${String(download.status)}`);
      // sharp writes no metadata unless asked to.
      await sharp(Buffer.from(await download.arrayBuffer()))
        .resize(VSCODE_ICON_SIZE, VSCODE_ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90, alphaQuality: 100, effort: 6 })
        .toFile(path.join(publicDir, vscodeExtensionIcon(id)));
      withIcon.add(id);
    } catch (error) {
      failed.push(`${id} (${error instanceof Error ? error.message : String(error)})`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// Icons of extensions that lost theirs, or are no longer listed.
const keep = new Set([...withIcon].map((id) => path.basename(vscodeExtensionIcon(id))));
for (const file of readdirSync(iconDir)) if (!keep.has(file)) rmSync(path.join(iconDir, file));

// Flag the extensions, one flow-map line each.
const FLAG = ", marketplaceIcon: true";
const seen = new Set<string>();
const lines = readFileSync(yamlFile, "utf8")
  .split("\n")
  .map((line) => {
    const match = /^(\s*- \{ id: ([a-z0-9][a-z0-9.-]*),.*?)(, marketplaceIcon: true)?( \})$/.exec(line);
    if (match === null) return line;
    const [, start = "", id = "", , end = ""] = match;
    seen.add(id);
    return `${start}${withIcon.has(id) ? FLAG : ""}${end}`;
  });
const unmatched = [...withIcon].filter((id) => !seen.has(id));
if (unmatched.length > 0) {
  console.error(
    `These extensions are not one-line "- { id: …, name: … }" entries, so they cannot be flagged:\n  ${unmatched.join("\n  ")}`
  );
  process.exit(1);
}
const text = lines.join("\n");
const check = Setup.safeParse(parse(text));
if (!check.success) {
  console.error(`The edited file would be invalid; the YAML was not written:\n${check.error.message}`);
  process.exit(1);
}
writeFileSync(yamlFile, text);

const without = onMarketplace.filter((id) => !withIcon.has(id));
console.warn(
  `${String(withIcon.size)} of ${String(onMarketplace.length)} Marketplace extensions have an icon in ${path.relative(process.cwd(), iconDir)}.`
);
if (without.length > 0) console.warn(`Without one (the page shows their logo instead):\n  ${without.join("\n  ")}`);
if (failed.length > 0) console.warn(`Failed to download (run it again):\n  ${failed.join("\n  ")}`);
console.warn("Review the icons, run pnpm content:check, and commit.");
