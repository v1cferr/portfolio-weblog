import { BriefcaseIcon, FolderGit2Icon, MessageCircleIcon, type LucideIcon, SignpostIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { SpineBranch } from "@/components/git-spine";
import { SectionHeading } from "@/components/page-header";
import { NAV_SECTION } from "@/components/page-transition";

import { AskButton, TrackedAnchor, TrackedLink } from "./cta";

const pathLink =
  "inline-flex min-h-11 items-center font-medium underline decoration-border underline-offset-4 hover:decoration-foreground sm:min-h-0";

/**
 * "Start here": three ways into the site for three kinds of visitor, each a
 * short line and a few links. Hiring leads to the profile and the career (and
 * contact, and the CV once the profile has one); the work, to the projects and
 * how the site itself was built; the AI, to the Ask panel with two sample questions.
 */
export async function StartHere({ email, cv }: { email?: string | undefined; cv?: string | undefined }) {
  const [t, ask] = await Promise.all([getTranslations("Home.startHere"), getTranslations("Ask")]);
  const samples = (ask.raw("suggestions") as string[]).slice(0, 2);

  return (
    <section aria-labelledby="start-here" className="mb-16">
      <SectionHeading id="start-here" icon={SignpostIcon} branch={<SpineBranch lane="career" />}>
        {t("title")}
      </SectionHeading>
      <ul className="grid gap-4 md:grid-cols-3">
        <Card icon={BriefcaseIcon} title={t("hiring.title")} body={t("hiring.body")} label="hiring">
          <TrackedLink href="/about" event="start_here_hiring" transitionTypes={NAV_SECTION} className={pathLink}>
            {t("hiring.about")}
          </TrackedLink>
          <TrackedLink href="/career" event="start_here_hiring" transitionTypes={NAV_SECTION} className={pathLink}>
            {t("hiring.career")}
          </TrackedLink>
          {email !== undefined && (
            <TrackedAnchor href={email} event="cta_contact" className={pathLink}>
              {t("hiring.contact")}
            </TrackedAnchor>
          )}
          {cv !== undefined && (
            <TrackedAnchor href={cv} event="cta_cv" target="_blank" rel="noopener" className={pathLink}>
              {t("hiring.cv")}
            </TrackedAnchor>
          )}
        </Card>
        <Card icon={FolderGit2Icon} title={t("work.title")} body={t("work.body")} label="work">
          <TrackedLink href="/projects" event="start_here_work" transitionTypes={NAV_SECTION} className={pathLink}>
            {t("work.projects")}
          </TrackedLink>
          <TrackedLink href="/decisions" event="start_here_work" transitionTypes={NAV_SECTION} className={pathLink}>
            {t("work.decisions")}
          </TrackedLink>
          <TrackedLink href="/weblog/how-this-site-is-built" event="start_here_work" transitionTypes={NAV_SECTION} className={pathLink}>
            {t("work.howBuilt")}
          </TrackedLink>
        </Card>
        <Card icon={MessageCircleIcon} title={t("ai.title")} body={t("ai.body")} label="ai" stack>
          <AskButton from="start_here" size="lg" className="self-start rounded-full px-4">
            {t("ai.open")}
          </AskButton>
          {samples.map((question) => (
            <AskButton
              key={question}
              from="start_here"
              question={question}
              variant="outline"
              className="h-auto min-h-11 justify-start rounded-xl px-3 py-1.5 text-left whitespace-normal sm:min-h-8"
            >
              {question}
            </AskButton>
          ))}
        </Card>
      </ul>
    </section>
  );
}

function Card({
  icon: Glyph,
  title,
  body,
  label,
  stack = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  label: string;
  /** One action per line (the AI card's sample questions) instead of a row of links. */
  stack?: boolean;
  children: ReactNode;
}) {
  const id = `start-here-${label}`;
  return (
    <li data-card={label} className="glass flex flex-col gap-3 rounded-2xl border p-5">
      <h3 id={id} className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
        <Glyph aria-hidden className="size-4.5 text-muted-foreground" />
        {title}
      </h3>
      <p className="text-pretty text-muted-foreground">{body}</p>
      <div className={cn("mt-auto flex gap-x-4 gap-y-2", stack ? "flex-col items-stretch" : "flex-wrap items-start")}>{children}</div>
    </li>
  );
}
