/**
 * Content integrity gate (pnpm content:check, run in CI): schemas, unique ids,
 * references, date order, and the public/private boundary. Exits non-zero on
 * any error; warnings are printed but do not fail the build.
 */
import path from "node:path";

import sharp from "sharp";

import {
  checkMedia,
  createRegistry,
  findContentRoot,
  formatIssues,
  loadContent,
  loadDecisionsContent,
  loadNowContent,
  loadTattoosContent,
  loadWowContent,
  publicNow,
  publicTattoos,
  publicWow,
  tattooMedia,
  wowMedia,
  validateContent,
} from "../src";

const root = findContentRoot();
const { content, issues } = loadContent(root);
const { errors, warnings } = validateContent(content);
const tattoos = loadTattoosContent(root);
const wow = loadWowContent(root);
const mediaIssues = await checkMedia(content, path.join(root, "..", "apps", "web", "public"), (file) => sharp(file).metadata(), [
  ...tattooMedia(tattoos.tattoos),
  ...wowMedia(wow.wow),
]);
const now = loadNowContent(root);
const decisions = loadDecisionsContent(root);
const all = [...issues, ...errors, ...mediaIssues, ...now.issues, ...wow.issues, ...tattoos.issues, ...decisions.issues];

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
    count("recommendations", everything.getRecommendations().length, publicView.getRecommendations().length),
    count("posts", everything.getPostSlugs().length, publicView.getPostSlugs().length),
    count("job stories", everything.getStoryIds().length, publicView.getStoryIds().length),
    count("now updates", now.log.entries.length, publicNow(now.log).entries.length),
    count("wow characters", wow.wow?.characters.length ?? 0, publicWow(wow.wow)?.characters.length ?? 0),
    count("tattoos", tattoos.tattoos?.tattoos.length ?? 0, publicTattoos(tattoos.tattoos)?.tattoos.length ?? 0),
    count("decisions", decisions.decisions.length, decisions.decisions.length),
    count("technologies", everything.getTechnologies().length, publicView.getTechnologies().length),
  ].join("\n")
);
