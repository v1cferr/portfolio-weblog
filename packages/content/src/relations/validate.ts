import { isOrdered } from "../dates";
import type { ContentIssue } from "../loaders/errors";
import type { RawContent } from "../loaders/load";
import { excerptPieces, type PartialDate } from "../schemas";
import { collectEdges, collectNodes, type Edge, type EntityNode } from "./graph";

export interface ValidationResult {
  errors: ContentIssue[];
  /** Not fatal: e.g. a public entity pointing at one still in review, which is simply not rendered yet. */
  warnings: ContentIssue[];
}

/** Cross-file rules that a single schema cannot express. */
export function validateContent(content: RawContent): ValidationResult {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];
  const nodes = collectNodes(content);

  // Ids are unique across every entity type, so a relation or a URL never has to guess.
  const byId = new Map<string, EntityNode>();
  for (const node of nodes) {
    const previous = byId.get(node.id);
    if (previous !== undefined) {
      errors.push({
        file: node.file,
        message: `duplicate id "${node.id}" (${node.type}); already used by ${previous.type} in ${previous.file}`,
      });
      continue;
    }
    byId.set(node.id, node);
  }

  for (const edge of collectEdges(content)) checkEdge(edge, byId, errors, warnings);

  // The profile is not a node, but its trajectory links into the graph.
  if (content.profile !== undefined) {
    const { value, file } = content.profile;
    for (const step of value.trajectory) {
      if (step.ref === undefined) continue;
      const target = byId.get(step.ref);
      if (target === undefined) errors.push({ file, message: `trajectory → "${step.ref}": no entity with this id` });
      else if (target.isPrivate)
        errors.push({ file, message: `trajectory → "${step.ref}": public content cannot reference private content` });
    }
    for (const chip of value.stack) {
      for (const id of chip.technologies) {
        const target = byId.get(id);
        if (target?.type !== "technology") errors.push({ file, message: `stack "${chip.label}" → "${id}": no technology with this id` });
      }
    }
  }

  const order = (file: string, what: string, start: PartialDate | undefined, end: PartialDate | undefined) => {
    if (start !== undefined && end !== undefined && !isOrdered(start, end)) {
      errors.push({ file, message: `${what}: end ${end} is before start ${start}` });
    }
  };
  for (const { value, file } of content.experiences) {
    value.positions.forEach((position, index) => {
      order(file, `positions.${index}`, position.start, position.end);
      if (position.start === undefined && value.status === "published") {
        errors.push({ file, message: `positions.${index}: a published experience needs a start date for every position` });
      }
    });
  }
  for (const { value, file } of content.projects) order(file, "project", value.startedAt, value.endedAt);
  for (const { value, file } of content.education) order(file, "education", value.start, value.end);
  for (const { value, file } of content.certifications) order(file, "certification", value.issuedAt, value.expiresAt);
  for (const post of content.posts) {
    const fm = post.frontmatter;
    order(post.file, "post", fm.publishedAt, fm.updatedAt);
    if (fm.status === "published" && fm.publishedAt === undefined) {
      errors.push({ file: post.file, message: "a published post needs publishedAt" });
    }
    // The tree must not lie: a dated post sits in the folder of its publication month.
    if (fm.publishedAt !== undefined && !post.folderDate.startsWith(fm.publishedAt.slice(0, 7))) {
      const [year = "", month = "<MM>"] = fm.publishedAt.split("-");
      errors.push({
        file: post.file,
        message: `publishedAt ${fm.publishedAt} disagrees with the folder ${post.folderDate.replace("-", "/")}; move the post to weblog/${year}/${month}/${post.slug}`,
      });
    }
  }

  // Translations of one post must agree on whether the post exists publicly.
  const visibilityByDir = new Map<string, Set<string>>();
  for (const post of content.posts) {
    const set = visibilityByDir.get(post.dir) ?? new Set<string>();
    set.add(post.frontmatter.visibility);
    visibilityByDir.set(post.dir, set);
  }
  for (const [dir, set] of visibilityByDir) {
    if (set.size > 1) errors.push({ file: dir, message: "translations disagree on visibility" });
  }

  // A story belongs to an experience and stays inside its boundary.
  const storyVisibility = new Map<string, Set<string>>();
  for (const story of content.stories) {
    const fm = story.frontmatter;
    const target = byId.get(story.experience);
    if (target?.type !== "experience") {
      errors.push({ file: story.file, message: `no experience "${story.experience}" for this story (the folder must be named after one)` });
    } else if (fm.status === "published" && fm.visibility === "public") {
      if (target.isPrivate) errors.push({ file: story.file, message: "a public story cannot belong to a private experience" });
      else if (!target.isPublic)
        warnings.push({ file: story.file, message: "the experience is not published yet, so the story is hidden too" });
    }
    const set = storyVisibility.get(story.experience) ?? new Set<string>();
    set.add(fm.visibility);
    storyVisibility.set(story.experience, set);
  }
  for (const [experience, set] of storyVisibility) {
    if (set.size > 1) errors.push({ file: `experiences/${experience}`, message: "story translations disagree on visibility" });
  }

  checkRecommendations(content, byId, errors, warnings);

  return { errors, warnings };
}

/**
 * A recommendation points at the organization, job and course it comes from,
 * and its excerpt quotes the text: every piece between "…" must appear word
 * for word in the same locale's text, so a quote is never a paraphrase.
 */
function checkRecommendations(content: RawContent, byId: Map<string, EntityNode>, errors: ContentIssue[], warnings: ContentIssue[]) {
  for (const { value, file } of content.recommendations) {
    const isPublic = value.status === "published" && value.visibility === "public";
    const refs: [string, EntityNode["type"], string | undefined][] = [
      ["relation.organization", "organization", value.relation?.organization],
      ["relation.experience", "experience", value.relation?.experience],
      ["relation.education", "education", value.relation?.education],
    ];
    for (const [field, type, id] of refs) {
      if (id === undefined) continue;
      const target = byId.get(id);
      const where = `${field} → "${id}"`;
      if (target?.type !== type) errors.push({ file, message: `${where}: no ${type} with this id` });
      else if (isPublic && target.isPrivate) errors.push({ file, message: `${where}: public content cannot reference private content` });
      else if (isPublic && !target.isPublic) warnings.push({ file, message: `${where}: target is not published yet and is hidden` });
    }
    for (const [locale, excerpt] of Object.entries(value.excerpt ?? {})) {
      const paragraphs = value.text[locale as keyof typeof value.text];
      if (paragraphs === undefined) {
        errors.push({ file, message: `excerpt.${locale}: there is no ${locale} text to quote from` });
        continue;
      }
      const text = paragraphs.join("\n");
      for (const piece of excerptPieces(excerpt)) {
        if (!text.includes(piece))
          errors.push({ file, message: `excerpt.${locale}: "${piece}" is not in the ${locale} text word for word` });
      }
    }
  }
  const featured = content.recommendations.flatMap(({ value, file }) =>
    value.featured === undefined ? [] : [{ n: value.featured, file }]
  );
  for (const { n, file } of featured) {
    if (featured.filter((other) => other.n === n).length > 1) errors.push({ file, message: `featured: ${String(n)} is used twice` });
  }
}

function checkEdge(edge: Edge, byId: Map<string, EntityNode>, errors: ContentIssue[], warnings: ContentIssue[]) {
  const target = byId.get(edge.to.id);
  const where = `${edge.field} → "${edge.to.id}"`;
  if (target === undefined) {
    errors.push({ file: edge.file, message: `${where}: no ${edge.to.type} with this id` });
    return;
  }
  if (target.type !== edge.to.type) {
    errors.push({ file: edge.file, message: `${where}: expected a ${edge.to.type}, found a ${target.type}` });
    return;
  }
  const source = byId.get(edge.from.id);
  if (source?.isPublic !== true) return;
  if (target.isPrivate) {
    // Rendering the link would disclose that the private entity exists.
    errors.push({ file: edge.file, message: `${where}: public content cannot reference private content` });
  } else if (!target.isPublic) {
    warnings.push({ file: edge.file, message: `${where}: target is not published yet and is hidden from public pages` });
  }
}
