import { cn } from "@workspace/ui/lib/utils";

/** What a bar needs per language: serializable, so client cards can take it too. */
export interface LanguageSliceData {
  name: string;
  percent: number;
  color: string;
}

/** "TypeScript 92.5%, MDX 4.1%": the bar's accessible name, top languages first. */
export function describeLanguages(languages: readonly LanguageSliceData[], locale: string, max = languages.length): string {
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return languages
    .slice(0, max)
    .map((language) => `${language.name} ${format.format(language.percent)}%`)
    .join(", ");
}

/**
 * GitHub's stacked language bar: one slice per language, in its linguist
 * colour, as wide as its share. Static (no animation), so it is the same with
 * reduced motion. The slices are decorative; the caller gives the bar its
 * accessible name.
 */
export function LanguageBar({
  languages,
  label,
  className,
}: {
  languages: readonly LanguageSliceData[];
  /** Accessible name; without one the bar is hidden from assistive technology. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      {...(label !== undefined ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      data-testid="language-bar"
      className={cn("flex overflow-hidden", className)}
    >
      {languages.map((language) => (
        <span
          key={language.name}
          className="h-full min-w-px not-last:border-r-2 not-last:border-r-transparent"
          // Grow by share rather than a fixed width: rounded shares that add up to 99.9 still fill the bar.
          style={{ flex: `${String(language.percent)} 1 0%`, backgroundColor: language.color, backgroundClip: "padding-box" }}
        />
      ))}
    </div>
  );
}
