import { compareDesc } from "../dates";
import { ContentValidationError, type ContentIssue } from "../loaders/errors";
import { loadContent, type PostSource, type RawContent } from "../loaders/load";
import { fallbackChain } from "../locale";
import { collectEdges, collectNodes, type EntityRef, type EntityType } from "../relations/graph";
import { validateContent } from "../relations/validate";
import type { Certification, Education, Experience, Locale, Organization, Profile, Project, Setup, Skill, Technology } from "../schemas";
import { buildCareerTimeline, buildUnifiedTimeline, type TimelineEnrichment, type TimelineEvent } from "../timeline/timeline";

export interface Post extends PostSource {
  /** Locales with a published translation of this post. */
  availableLocales: Locale[];
  /** True when the requested locale has no translation and another one is served. */
  isFallback: boolean;
}

export interface RelatedEntity extends EntityRef {
  /** Field that declares the relation, seen from the side that declared it. */
  field: string;
  direction: "outgoing" | "incoming";
}

export interface ContentRegistry {
  getProfile(): Profile;
  getSetup(): Setup | undefined;
  getOrganizations(): Organization[];
  getOrganization(id: string): Organization | undefined;
  getTechnologies(): Technology[];
  getTechnology(id: string): Technology | undefined;
  getSkills(): Skill[];
  getSkill(id: string): Skill | undefined;
  /** Newest first, by the most recent position. */
  getExperiences(): Experience[];
  getExperience(id: string): Experience | undefined;
  /** Featured first, then newest first. */
  getProjects(): Project[];
  getProject(id: string): Project | undefined;
  getEducation(): Education[];
  getCertifications(): Certification[];
  /** One entry per post: the requested translation, or a fallback flagged as such. Newest first. */
  getPosts(locale: Locale): Post[];
  getPost(slug: string, locale: Locale): Post | undefined;
  getPostSlugs(): string[];
  getCareerTimeline(): TimelineEvent[];
  getUnifiedTimeline(enrichment?: TimelineEnrichment): TimelineEvent[];
  getRelatedContent(id: string): RelatedEntity[];
  /** Path, relative to the content root, of the file that declares a visible entity. */
  getSourceFile(id: string): string | undefined;
  /** Type of any entity visible through this registry. */
  getEntityType(id: string): EntityType | undefined;
  readonly warnings: readonly ContentIssue[];
}

export interface RegistryOptions {
  /**
   * Include drafts, entities in review and private entities. Only for tooling
   * (the content checker); public pages must never set it.
   */
  includeUnpublished?: boolean;
}

type Gated = { status: string; visibility: string };
const isPublic = (value: Gated) => value.status === "published" && value.visibility === "public";
const isPublicPost = (post: PostSource) => isPublic(post.frontmatter);

function latestStart(experience: Experience): string {
  const starts = experience.positions.map((p) => p.start).filter((start) => start !== undefined);
  return starts.sort((a, b) => compareDesc(a, b))[0] ?? "0000";
}

/**
 * Builds the read API over already-validated content. Entities that are not
 * public are dropped, and so are references to them, so a page can render any
 * relation it receives without checking visibility again.
 */
export function createRegistry(
  content: RawContent,
  warnings: readonly ContentIssue[] = [],
  options: RegistryOptions = {}
): ContentRegistry {
  const visible = options.includeUnpublished === true ? () => true : isPublic;
  const visiblePost = options.includeUnpublished === true ? () => true : isPublicPost;

  const posts = content.posts.filter(visiblePost);
  const nodes = collectNodes(content).filter((node) => {
    if (node.type === "post") return posts.some((post) => post.slug === node.id);
    return options.includeUnpublished === true || node.isPublic;
  });
  const visibleIds = new Map(nodes.map((node) => [node.id, node.type]));
  // An entity whose organization is hidden is hidden too, everywhere.
  const hiddenOwner = (owner: string) => visibleIds.get(owner) !== "organization";
  for (const { value } of content.experiences) if (hiddenOwner(value.organization)) visibleIds.delete(value.id);
  for (const { value } of content.education) if (hiddenOwner(value.institution)) visibleIds.delete(value.id);
  for (const { value } of content.certifications) if (hiddenOwner(value.issuer)) visibleIds.delete(value.id);
  const keep = (ids: readonly string[]) => ids.filter((id) => visibleIds.has(id));

  const pick = <T extends Gated & { id: string }>(items: { value: T }[]) =>
    items.map((item) => item.value).filter((value) => visible(value) && visibleIds.has(value.id));

  const organizations = pick(content.organizations);
  const technologies = pick(content.technologies);
  const skills = pick(content.skills).map((skill) => ({ ...skill, technologies: keep(skill.technologies) }));
  const experiences = pick(content.experiences)
    .map((experience) => ({
      ...experience,
      technologies: keep(experience.technologies),
      skills: keep(experience.skills),
      projects: keep(experience.projects),
    }))
    .sort((a, b) => compareDesc(latestStart(a), latestStart(b)));
  const projects = pick(content.projects)
    .map((project) => ({
      ...project,
      technologies: keep(project.technologies),
      skills: keep(project.skills),
      experiences: keep(project.experiences),
    }))
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        compareDesc(a.startedAt ?? "0000", b.startedAt ?? "0000") ||
        a.title.localeCompare(b.title)
    );
  const education = pick(content.education)
    .map((item) => ({ ...item, technologies: keep(item.technologies), projects: keep(item.projects) }))
    .sort((a, b) => compareDesc(a.start ?? "0000", b.start ?? "0000"));
  const certifications = pick(content.certifications)
    .map((cert) => ({ ...cert, technologies: keep(cert.technologies) }))
    .sort((a, b) => compareDesc(a.issuedAt, b.issuedAt));

  const prunePost = (post: PostSource): PostSource => ({
    ...post,
    frontmatter: {
      ...post.frontmatter,
      projects: keep(post.frontmatter.projects),
      experiences: keep(post.frontmatter.experiences),
      technologies: keep(post.frontmatter.technologies),
    },
  });

  const translations = new Map<string, Map<Locale, PostSource>>();
  for (const post of posts) {
    const bySlug = translations.get(post.slug) ?? new Map<Locale, PostSource>();
    bySlug.set(post.locale, prunePost(post));
    translations.set(post.slug, bySlug);
  }

  function getPost(slug: string, locale: Locale): Post | undefined {
    const bySlug = translations.get(slug);
    if (bySlug === undefined) return undefined;
    for (const candidate of fallbackChain(locale)) {
      const post = bySlug.get(candidate);
      if (post !== undefined) return { ...post, availableLocales: [...bySlug.keys()], isFallback: candidate !== locale };
    }
    return undefined;
  }

  const byId = <T extends { id: string }>(items: T[]) => {
    const map = new Map(items.map((item) => [item.id, item]));
    return (id: string) => map.get(id);
  };

  // Relations among visible entities only, in both directions.
  const edges = collectEdges(content).filter((edge) => visibleIds.has(edge.from.id) && visibleIds.has(edge.to.id));

  const sourceFiles = new Map(nodes.map((node) => [node.id, node.file]));
  const profileSource = content.profile?.value;
  if (profileSource === undefined) throw new Error("The profile is missing; run the content checker");
  const profile = {
    ...profileSource,
    trajectory: profileSource.trajectory.map((step) =>
      step.ref !== undefined && !visibleIds.has(step.ref) ? { label: step.label } : step
    ),
  };

  const publishedAtBySlug = () =>
    [...translations.keys()].map((slug) => ({ slug, publishedAt: getPost(slug, "en-us")?.frontmatter.publishedAt }));

  return {
    getProfile: () => profile,
    getSetup: () => (content.setup !== undefined && visible(content.setup.value) ? content.setup.value : undefined),
    getOrganizations: () => organizations,
    getOrganization: byId(organizations),
    getTechnologies: () => technologies,
    getTechnology: byId(technologies),
    getSkills: () => skills,
    getSkill: byId(skills),
    getExperiences: () => experiences,
    getExperience: byId(experiences),
    getProjects: () => projects,
    getProject: byId(projects),
    getEducation: () => education,
    getCertifications: () => certifications,
    getPosts: (locale) =>
      [...translations.keys()]
        .map((slug) => getPost(slug, locale))
        .filter((post): post is Post => post !== undefined)
        .sort((a, b) => compareDesc(a.frontmatter.publishedAt ?? "0000", b.frontmatter.publishedAt ?? "0000")),
    getPost,
    getPostSlugs: () => [...translations.keys()],
    getCareerTimeline: () => buildCareerTimeline(experiences),
    getUnifiedTimeline: (enrichment) =>
      buildUnifiedTimeline({ experiences, projects, education, certifications, posts: publishedAtBySlug() }, enrichment),
    getRelatedContent: (id) => [
      ...edges.filter((edge) => edge.from.id === id).map((edge) => ({ ...edge.to, field: edge.field, direction: "outgoing" as const })),
      ...edges.filter((edge) => edge.to.id === id).map((edge) => ({ ...edge.from, field: edge.field, direction: "incoming" as const })),
    ],
    getSourceFile: (id) => (visibleIds.has(id) ? sourceFiles.get(id) : undefined),
    getEntityType: (id) => visibleIds.get(id),
    warnings,
  };
}

/** Loads, validates and indexes the content tree; throws with every problem when it is invalid. */
export function loadRegistry(root: string, options: RegistryOptions = {}): ContentRegistry {
  const { content, issues } = loadContent(root);
  const { errors, warnings } = validateContent(content);
  const all = [...issues, ...errors];
  if (all.length > 0) throw new ContentValidationError(all);
  return createRegistry(content, warnings, options);
}
