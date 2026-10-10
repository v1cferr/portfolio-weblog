import type { RawContent } from "../loaders/load";

export type EntityType = "organization" | "technology" | "skill" | "experience" | "project" | "education" | "certification" | "post";

export interface EntityRef {
  type: EntityType;
  id: string;
}

export interface Edge {
  from: EntityRef;
  to: EntityRef;
  /** Field that declares the relation, e.g. "technologies". */
  field: string;
  file: string;
}

export interface EntityNode extends EntityRef {
  file: string;
  isPublic: boolean;
  isPrivate: boolean;
}

/** Every entity that can be referenced, keyed by id (ids are unique across types). */
export function collectNodes(content: RawContent): EntityNode[] {
  const nodes: EntityNode[] = [];
  const add = (type: EntityType, items: { value: { id: string; status: string; visibility: string }; file: string }[]) => {
    for (const { value, file } of items) {
      nodes.push({
        type,
        id: value.id,
        file,
        isPublic: value.status === "published" && value.visibility === "public",
        isPrivate: value.visibility === "private",
      });
    }
  };
  add("organization", content.organizations);
  add("technology", content.technologies);
  add("skill", content.skills);
  add("experience", content.experiences);
  add("project", content.projects);
  add("education", content.education);
  add("certification", content.certifications);

  // A post is one node per slug; it is public when any translation is.
  const bySlug = new Map<string, EntityNode>();
  for (const post of content.posts) {
    const isPublic = post.frontmatter.status === "published" && post.frontmatter.visibility === "public";
    const existing = bySlug.get(post.slug);
    if (existing === undefined) {
      bySlug.set(post.slug, {
        type: "post",
        id: post.slug,
        file: post.file,
        isPublic,
        isPrivate: post.frontmatter.visibility === "private",
      });
    } else {
      existing.isPublic ||= isPublic;
    }
  }
  nodes.push(...bySlug.values());
  return nodes;
}

/** Forward relations exactly as declared in content files. */
export function collectEdges(content: RawContent): Edge[] {
  const edges: Edge[] = [];
  const link = (from: EntityRef, field: string, type: EntityType, ids: readonly string[], file: string) => {
    for (const id of ids) edges.push({ from, to: { type, id }, field, file });
  };

  for (const { value, file } of content.skills) {
    link({ type: "skill", id: value.id }, "technologies", "technology", value.technologies, file);
  }
  for (const { value, file } of content.experiences) {
    const from = { type: "experience", id: value.id } as const;
    link(from, "organization", "organization", [value.organization], file);
    link(from, "technologies", "technology", value.technologies, file);
    link(from, "skills", "skill", value.skills, file);
    link(from, "projects", "project", value.projects, file);
  }
  for (const { value, file } of content.projects) {
    const from = { type: "project", id: value.id } as const;
    link(from, "technologies", "technology", value.technologies, file);
    link(from, "skills", "skill", value.skills, file);
    link(from, "experiences", "experience", value.experiences, file);
  }
  for (const { value, file } of content.education) {
    const from = { type: "education", id: value.id } as const;
    link(from, "institution", "organization", [value.institution], file);
    link(from, "technologies", "technology", value.technologies, file);
    link(from, "skills", "skill", value.skills, file);
    link(from, "projects", "project", value.projects, file);
  }
  for (const { value, file } of content.certifications) {
    const from = { type: "certification", id: value.id } as const;
    link(from, "issuer", "organization", [value.issuer], file);
    link(from, "technologies", "technology", value.technologies, file);
  }
  for (const post of content.posts) {
    const from = { type: "post", id: post.slug } as const;
    link(from, "projects", "project", post.frontmatter.projects, post.file);
    link(from, "experiences", "experience", post.frontmatter.experiences, post.file);
    link(from, "technologies", "technology", post.frontmatter.technologies, post.file);
  }
  return edges;
}
