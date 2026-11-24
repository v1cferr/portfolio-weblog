import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { localize, localizeList, type CaseStudy, type Locale, type LocalizedList, type LocalizedText } from "@workspace/content";
import { ChevronDownIcon, ExternalLinkIcon, ScrollTextIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ExternalLink } from "@/components/external-link";

/*
 * A project's case study in two layers (ADR 0014): the TL;DR card on the first
 * screen, then the deep dive. Every section renders only when its content
 * exists, so a field the owner has not written yet leaves no empty heading.
 */

function text(value: LocalizedText | undefined, locale: Locale) {
  return value === undefined ? undefined : localize(value, locale);
}

function list(value: LocalizedList | undefined, locale: Locale) {
  return localizeList(value, locale);
}

/** A labelled fact inside the TL;DR card. */
function Fact({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "space-y-1 sm:col-span-2" : "space-y-1"}>
      <dt className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-pretty">{children}</dd>
    </div>
  );
}

/**
 * The first layer: the problem, the outcome when there is one, the role, and
 * whatever the page passes in as dates, stack and links.
 */
export async function CaseStudySummary({
  caseStudy,
  locale,
  dates,
  stack,
  links,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dates?: ReactNode;
  stack?: ReactNode;
  links?: ReactNode;
}) {
  const t = await getTranslations("CaseStudy");
  const problem = localize(caseStudy.problem, locale);
  const outcome = text(caseStudy.outcome, locale);
  const role = localize(caseStudy.role, locale);
  return (
    <section aria-labelledby="tldr">
      <Card variant="glass" className="gap-4 py-5">
        <CardHeader className="px-5">
          <h2 id="tldr" className="font-display text-sm font-semibold tracking-wide uppercase">
            {t("tldr")}
          </h2>
        </CardHeader>
        <CardContent className="px-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label={t("problem")} wide>
              <span className="text-lg" lang={problem.locale}>
                {problem.value}
              </span>
            </Fact>
            {outcome !== undefined && (
              <Fact label={t("outcome")} wide>
                <span lang={outcome.locale}>{outcome.value}</span>
              </Fact>
            )}
            <Fact label={t("role")}>
              <span lang={role.locale}>{role.value}</span>
            </Fact>
            {dates !== undefined && <Fact label={t("dates")}>{dates}</Fact>}
            {stack !== undefined && (
              <Fact label={t("stack")} wide>
                {stack}
              </Fact>
            )}
            {links !== undefined && (
              <Fact label={t("links")} wide>
                {links}
              </Fact>
            )}
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: { value: string[]; locale: string } }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-lane-project" lang={items.locale}>
      {items.value.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** The second layer: motivation, constraints, decisions, how it was built, lessons, next. */
export async function CaseStudyDeepDive({ caseStudy, locale }: { caseStudy: CaseStudy; locale: Locale }) {
  const t = await getTranslations("CaseStudy");
  const motivation = text(caseStudy.motivation, locale);
  const constraints = list(caseStudy.constraints, locale);
  const nonGoals = list(caseStudy.nonGoals, locale);
  const approach = text(caseStudy.approach, locale);
  const quality = list(caseStudy.quality, locale);
  const howBuilt = text(caseStudy.howBuilt, locale);
  const lessons = list(caseStudy.lessons, locale);
  const next = list(caseStudy.next, locale);

  return (
    <div className="space-y-10">
      {motivation !== undefined && (
        <Section id="motivation" title={t("motivation")}>
          <p className="leading-relaxed text-pretty" lang={motivation.locale}>
            {motivation.value}
          </p>
        </Section>
      )}
      {(constraints !== undefined || nonGoals !== undefined) && (
        <Section id="constraints" title={t("constraints")}>
          {constraints !== undefined && <Bullets items={constraints} />}
          {nonGoals !== undefined && (
            <>
              <h3 className="pt-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">{t("nonGoals")}</h3>
              <Bullets items={nonGoals} />
            </>
          )}
        </Section>
      )}
      {approach !== undefined && (
        <Section id="approach" title={t("approach")}>
          <p className="leading-relaxed text-pretty" lang={approach.locale}>
            {approach.value}
          </p>
        </Section>
      )}
      <Section id="decisions" title={t("decisions")}>
        <ul className="space-y-3">
          {caseStudy.decisions.map((decision, index) => {
            const title = localize(decision.title, locale);
            const chosen = localize(decision.chosen, locale);
            const alternatives = localizeList(decision.alternatives, locale);
            const why = localize(decision.why, locale);
            const cost = localize(decision.cost, locale);
            return (
              <li key={title.value}>
                <details open={index === 0} className="group glass rounded-xl border">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 font-semibold focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    <span lang={title.locale}>{title.value}</span>
                    <ChevronDownIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <div className="space-y-3 px-4 pb-4 leading-relaxed text-pretty">
                    <p>
                      <span className="font-medium">{t("chose")}</span> <span lang={chosen.locale}>{chosen.value}</span>
                      {alternatives !== undefined && (
                        <>
                          {" "}
                          <span className="font-medium">{t("over")}</span>{" "}
                          <span lang={alternatives.locale}>{alternatives.value.join(t("orSeparator"))}</span>
                        </>
                      )}
                      {", "}
                      <span className="font-medium">{t("because")}</span> <span lang={why.locale}>{why.value}</span>
                    </p>
                    <p>
                      <span className="font-medium">{t("cost")}</span> <span lang={cost.locale}>{cost.value}</span>
                    </p>
                    {decision.adr !== undefined && (
                      <p>
                        <ExternalLink
                          href={decision.adr}
                          className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-lane-project underline-offset-4 hover:underline"
                        >
                          <ScrollTextIcon aria-hidden className="size-4" />
                          {t("readAdr")}
                          <ExternalLinkIcon aria-hidden className="icon-out size-3.5" />
                        </ExternalLink>
                      </p>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </Section>
      {(howBuilt !== undefined || quality !== undefined) && (
        <Section id="how-built" title={t("howBuilt")}>
          {howBuilt !== undefined && (
            <p className="leading-relaxed text-pretty" lang={howBuilt.locale}>
              {howBuilt.value}
            </p>
          )}
          {quality !== undefined && (
            <>
              <h3 className="pt-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">{t("quality")}</h3>
              <Bullets items={quality} />
            </>
          )}
        </Section>
      )}
      {lessons !== undefined && (
        <Section id="lessons" title={t("lessons")}>
          <Bullets items={lessons} />
        </Section>
      )}
      {next !== undefined && (
        <Section id="next" title={t("next")}>
          <Bullets items={next} />
        </Section>
      )}
    </div>
  );
}
