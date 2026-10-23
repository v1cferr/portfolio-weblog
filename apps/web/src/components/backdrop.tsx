/*
 * The page background: the commit graph's four lanes (career, project, study,
 * writing) as faint vertical lines that fade out down the page, and a soft glow
 * of the project lane behind the hero. Picked from a bake-off on 2026-10-23
 * (docs/decisions/0007-visual-system.md). CSS only: no image, no client code.
 * It gives the glass surfaces something to blur.
 */
const LANES = ["career", "project", "study", "writing"] as const;

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] size-[80%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--lane-project)_26%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--lane-project)_30%,transparent),transparent)]" />
      <div className="absolute inset-y-0 right-[8%] flex w-[24%] justify-between max-sm:right-[4%] max-sm:w-[30%]">
        {LANES.map((lane) => (
          <span
            key={lane}
            className="h-full w-0.5 opacity-25 sm:opacity-40 dark:opacity-20 sm:dark:opacity-35"
            style={{ backgroundImage: `linear-gradient(180deg, var(--lane-${lane}), transparent 85%)` }}
          />
        ))}
      </div>
    </div>
  );
}
