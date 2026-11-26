import { compareDesc } from "../dates";
import { ContentValidationError, type ContentIssue } from "../loaders/errors";
import { loadContent, type PostSource, type RawContent, type StorySource } from "../loaders/load";
import { fallbackChain } from "../locale";
import { collectEdges, collectNodes, type EntityRef, type EntityType } from "../relations/graph";
import { validateContent } from "../relations/validate";
import {
  type CareerBreak,
  type Certification,
  type Education,
  type Experience,
  isVolunteering,
  type Locale,
  type Organization,
  type Profile,
  type Project,
  type PublishedRecommendation,
  type Setup,
  type Skill,
  type Technology,
} from "../schemas";
import { buildCareerTimeline, buildUnifiedTimeline, type TimelineEnrichment, type TimelineEvent } from "../timeline/timeline";

export interface Post extends PostSource {
  /** Locales with a published translation of this post. */
  availableLocales: Locale[];
  /** True when the requested locale has no translation and another one is served. */
  isFallback: boolean;
}

export interface Story extends StorySource {
  /** Locales with a published translation of this story. */
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
  /** Volunteering, kept out of the experiences above. Newest first. */
  getVolunteering(): Experience[];
  /** Career breaks (a move, a study period): no organization, no page, never counted as career. Newest first. */
  getCareerBreaks(): CareerBreak[];
  /** Featured first, then newest first. */
  getProjects(): Project[];
  getProject(id: string): Project | undefined;
  getEducation(): Education[];
  getCertifications(): Certification[];
  /** Newest first. A relation to a hidden job or course is dropped; a hidden organization hides the recommendation. */
  getRecommendations(): PublishedRecommendation[];
  /** One entry per post: the requested translation, or a fallback flagged as such. Newest first. */
  getPosts(locale: Locale): Post[];
  getPost(slug: string, locale: Locale): Post | undefined;
  getPostSlugs(): string[];
  /** The long-form story of a visible experience: the requested translation, or a fallback flagged as such. */
  getStory(experienceId: string, locale: Locale): Story | undefined;
  /** Ids of the visible experiences that have a visible story. */
  getStoryIds(): string[];
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
  const allExperiences = pick(content.experiences)
    .map((experience) => ({
      ...experience,
      technologies: keep(experience.technologies),
      skills: keep(experience.skills),
      projects: keep(experience.projects),
    }))
    .sort((a, b) => compareDesc(latestStart(a), latestStart(b)));
  const experiences = allExperiences.filter((experience) => !isVolunteering(experience));
  const volunteering = allExperiences.filter(isVolunteering);
  const careerBreaks = pick(content.careerBreaks)
    .map((item) => ({ ...item, overlaps: keep(item.overlaps) }))
    .sort((a, b) => compareDesc(a.start, b.start));
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
    .map((item) => ({ ...item, technologies: keep(item.technologies), skills: keep(item.skills), projects: keep(item.projects) }))
    .sort((a, b) => compareDesc(a.start ?? "0000", b.start ?? "0000"));
  const certifications = pick(content.certifications)
    .map((cert) => ({ ...cert, technologies: keep(cert.technologies) }))
    .sort((a, b) => compareDesc(a.issuedAt, b.issuedAt));

  const recommendations = content.recommendations
    .map((item) => item.value)
    .filter(
      (value): value is PublishedRecommendation =>
        visible(value) && value.relation !== undefined && visibleIds.get(value.relation.organization) === "organization"
    )
    .map((value): PublishedRecommendation => ({
      ...value,
      relation: {
        ...value.relation,
        experience:
          value.relation.experience !== undefined && visibleIds.has(value.relation.experience) ? value.relation.experience : undefined,
        education:
          value.relation.education !== undefined && visibleIds.has(value.relation.education) ? value.relation.education : undefined,
      },
    }))
    .sort((a, b) => compareDesc(a.date, b.date) || a.name.localeCompare(b.name));

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

  // A story is visible only with its experience; the experience id is its key.
  const stories = new Map<string, Map<Locale, StorySource>>();
  for (const story of content.stories) {
    if (!visible(story.frontmatter) || !experiences.some((experience) => experience.id === story.experience)) continue;
    const byLocale = stories.get(story.experience) ?? new Map<Locale, StorySource>();
    byLocale.set(story.locale, story);
    stories.set(story.experience, byLocale);
  }

  function getStory(experienceId: string, locale: Locale): Story | undefined {
    const byLocale = stories.get(experienceId);
    if (byLocale === undefined) return undefined;
    for (const candidate of fallbackChain(locale)) {
      const story = byLocale.get(candidate);
      if (story !== undefined) return { ...story, availableLocales: [...byLocale.keys()], isFallback: candidate !== locale };
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
    getVolunteering: () => volunteering,
    getCareerBreaks: () => careerBreaks,
    getProjects: () => projects,
    getProject: byId(projects),
    getEducation: () => education,
    getCertifications: () => certifications,
    getRecommendations: () => recommendations,
    getPosts: (locale) =>
      [...translations.keys()]
        .map((slug) => getPost(slug, locale))
        .filter((post): post is Post => post !== undefined)
        .sort((a, b) => compareDesc(a.frontmatter.publishedAt ?? "0000", b.frontmatter.publishedAt ?? "0000")),
    getPost,
    getPostSlugs: () => [...translations.keys()],
    getStory,
    getStoryIds: () => [...stories.keys()],
    getCareerTimeline: () => buildCareerTimeline(experiences),
    getUnifiedTimeline: (enrichment) =>
      buildUnifiedTimeline(
        { experiences, volunteering, careerBreaks, projects, education, certifications, posts: publishedAtBySlug() },
        enrichment
      ),
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
