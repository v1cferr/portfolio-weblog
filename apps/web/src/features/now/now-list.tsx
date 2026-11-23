import { cn } from "@workspace/ui/lib/utils";
import { getTranslations } from "next-intl/server";
import { Fragment } from "react";

import { Link } from "@/i18n/navigation";
import type { NowItem } from "@/lib/now";

/** Each kind of bullet keeps the colour of its lane: career, projects, writing; the owner's own words get the brand. */
const marker: Record<NowItem["kind"], string> = {
  text: "bg-brand",
  role: "bg-lane-career",
  projects: "bg-lane-project",
  post: "bg-lane-writing",
};

const link = "font-medium underline decoration-foreground/25 underline-offset-4 hover:decoration-current";

/** The bullets of a now update, as a semantic list; derived bullets link to where they come from. */
export async function NowList({ items, label, className }: { items: NowItem[]; label: string; className?: string }) {
  const t = await getTranslations("Now");
  return (
    <ul aria-label={label} className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={key(item)} className="flex gap-3 leading-relaxed text-pretty">
          <span aria-hidden className={cn("mt-[0.6em] size-1.5 shrink-0 rounded-full", marker[item.kind])} />
          <span className="min-w-0">
            {item.kind === "text" && <span lang={item.text.locale}>{item.text.value}</span>}
            {item.kind === "role" && (
              <>
                <span className="text-muted-foreground">{t("role")} </span>
                <Link href="/career" className={cn(link, "hover:text-lane-career")} lang={item.title.locale}>
                  {item.title.value}
                </Link>
              </>
            )}
            {item.kind === "projects" && (
              <>
                <span className="text-muted-foreground">{t("projects")} </span>
                {item.projects.map((project, index) => (
                  <Fragment key={project.id}>
                    {index > 0 && ", "}
                    <Link href={`/projects/${project.id}`} className={cn(link, "font-mono text-[0.95em] hover:text-lane-project")}>
                      {project.title}
                    </Link>
                  </Fragment>
                ))}
                {item.more > 0 && (
                  <>
                    {" · "}
                    <Link href="/projects?state=active" className={cn(link, "hover:text-lane-project")}>
                      {t("moreProjects", { count: item.more })}
                    </Link>
                  </>
                )}
              </>
            )}
            {item.kind === "post" && (
              <>
                <span className="text-muted-foreground">{t("post")} </span>
                <Link href={`/weblog/${item.slug}`} className={cn(link, "hover:text-lane-writing")} lang={item.locale}>
                  {item.title}
                </Link>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function key(item: NowItem): string {
  switch (item.kind) {
    case "text":
      return `text:${item.text.value}`;
    case "role":
      return "role";
    case "projects":
      return "projects";
    case "post":
      return `post:${item.slug}`;
  }
}
