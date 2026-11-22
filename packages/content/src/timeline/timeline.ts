import { compareDesc } from "../dates";
import type { EntityRef } from "../relations/graph";
import type { Certification, Education, Experience, PartialDate, Project } from "../schemas";

export type TimelineKind = "position" | "project" | "education" | "certification" | "post";

export interface TimelineEvent {
  /** Unique within one timeline. */
  key: string;
  kind: TimelineKind;
  entity: EntityRef;
  date: PartialDate;
  end?: PartialDate | undefined;
  /** Index into experience.positions for "position" events. */
  positionIndex?: number;
  /**
   * Where the date came from. A repository's creation date is not when a
   * project started, so the UI labels it differently.
   */
  dateSource: "content" | "repository-created";
}

export interface TimelineInput {
  experiences: readonly Experience[];
  projects: readonly Project[];
  education: readonly Education[];
  certifications: readonly Certification[];
  posts: readonly { slug: string; publishedAt: PartialDate | undefined }[];
}

export interface TimelineEnrichment {
  /** ISO date a public repository was created, by "owner/name". */
  repositoryCreatedAt?: (repository: string) => string | undefined;
}

function sortEvents(events: TimelineEvent[]): TimelineEvent[] {
  return events.sort((a, b) => compareDesc(a.date, b.date) || a.key.localeCompare(b.key));
}

export function positionEvents(experiences: readonly Experience[]): TimelineEvent[] {
  return experiences.flatMap((experience) =>
    experience.positions.flatMap((position, index) =>
      position.start === undefined
        ? []
        : [
            {
              key: `position:${experience.id}:${index}`,
              kind: "position" as const,
              entity: { type: "experience" as const, id: experience.id },
              date: position.start,
              end: position.end,
              positionIndex: index,
              dateSource: "content" as const,
            },
          ]
    )
  );
}

/** Career only: every position at every organization, newest first. */
export function buildCareerTimeline(experiences: readonly Experience[]): TimelineEvent[] {
  return sortEvents(positionEvents(experiences));
}

/** Career, projects, studies and writing on one axis, newest first. */
export function buildUnifiedTimeline(input: TimelineInput, enrichment: TimelineEnrichment = {}): TimelineEvent[] {
  const events = positionEvents(input.experiences);

  for (const project of input.projects) {
    let date: PartialDate | undefined = project.startedAt;
    let dateSource: TimelineEvent["dateSource"] = "content";
    if (date === undefined && project.repository !== undefined) {
      const created = enrichment.repositoryCreatedAt?.(project.repository);
      if (created !== undefined) {
        date = created.slice(0, 10);
        dateSource = "repository-created";
      }
    }
    if (date === undefined) continue;
    events.push({
      key: `project:${project.id}`,
      kind: "project",
      entity: { type: "project", id: project.id },
      date,
      end: project.endedAt,
      dateSource,
    });
  }

  for (const item of input.education) {
    if (item.start === undefined) continue;
    events.push({
      key: `education:${item.id}`,
      kind: "education",
      entity: { type: "education", id: item.id },
      date: item.start,
      end: item.end,
      dateSource: "content",
    });
  }

  for (const cert of input.certifications) {
    events.push({
      key: `certification:${cert.id}`,
      kind: "certification",
      entity: { type: "certification", id: cert.id },
      date: cert.issuedAt,
      dateSource: "content",
    });
  }

  for (const post of input.posts) {
    if (post.publishedAt === undefined) continue;
    events.push({
      key: `post:${post.slug}`,
      kind: "post",
      entity: { type: "post", id: post.slug },
      date: post.publishedAt,
      dateSource: "content",
    });
  }

  return sortEvents(events);
}
