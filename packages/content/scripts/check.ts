/**
 * Content integrity gate (pnpm content:check, run in CI): schemas, unique ids,
 * references, date order, and the public/private boundary. Exits non-zero on
 * any error; warnings are printed but do not fail the build.
 */
import path from "node:path";

import sharp from "sharp";

import { checkMedia, createRegistry, findContentRoot, formatIssues, loadContent, validateContent } from "../src";

const root = findContentRoot();
const { content, issues } = loadContent(root);
const { errors, warnings } = validateContent(content);
const mediaIssues = await checkMedia(content, path.join(root, "..", "apps", "web", "public"), (file) => sharp(file).metadata());
const all = [...issues, ...errors, ...mediaIssues];

if (warnings.length > 0) console.warn(`Warnings (${warnings.length}):\n${formatIssues(warnings)}\n`);

if (all.length > 0) {
  console.error(`Content errors (${all.length}):\n${formatIssues(all)}`);
  process.exit(1);
}

const everything = createRegistry(content, warnings, { includeUnpublished: true });
const publicView = createRegistry(content, warnings);
const count = (label: string, total: number, visible: number) =>
  `  ${label.padEnd(15)} ${String(visible).padStart(3)} public / ${total} total`;

console.warn(
  [
    `Content OK (${root})`,
    count("experiences", everything.getExperiences().length, publicView.getExperiences().length),
    count("projects", everything.getProjects().length, publicView.getProjects().length),
    count("education", everything.getEducation().length, publicView.getEducation().length),
    count("certifications", everything.getCertifications().length, publicView.getCertifications().length),
    count("posts", everything.getPostSlugs().length, publicView.getPostSlugs().length),
    count("technologies", everything.getTechnologies().length, publicView.getTechnologies().length),
  ].join("\n")
);
