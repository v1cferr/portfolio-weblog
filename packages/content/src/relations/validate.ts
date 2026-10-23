import { isOrdered } from "../dates";
import type { ContentIssue } from "../loaders/errors";
import type { RawContent } from "../loaders/load";
import type { PartialDate } from "../schemas";
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
  }

  // Translations of one post must agree on whether the post exists publicly.
  const visibilityBySlug = new Map<string, Set<string>>();
  for (const post of content.posts) {
    const set = visibilityBySlug.get(post.slug) ?? new Set<string>();
    set.add(post.frontmatter.visibility);
    visibilityBySlug.set(post.slug, set);
  }
  for (const [slug, set] of visibilityBySlug) {
    if (set.size > 1) errors.push({ file: `weblog/${slug}`, message: "translations disagree on visibility" });
  }

  return { errors, warnings };
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
