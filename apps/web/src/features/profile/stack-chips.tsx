import { getContent } from "@/lib/content";
import { TechnologyIcon } from "@/components/icon";

/**
 * The owner's daily stack on the home hero, from `stack` in profile.yaml: one
 * chip per pairing ("Python/FastAPI"), showing each technology's logo. Plain
 * text, not links: the technology badges elsewhere already filter the catalogue.
 */
export function StackChips({ stack, label }: { stack: readonly { label: string; technologies: readonly string[] }[]; label: string }) {
  const content = getContent();
  if (stack.length === 0) return null;
  // One logo per distinct icon: Nix and NixOS share the snowflake, so that chip shows it once.
  const icons = (ids: readonly string[]) =>
    ids
      .map((id) => content.getTechnology(id))
      .filter((tech) => tech !== undefined)
      .filter((tech, index, all) => all.findIndex((other) => (other.icon ?? other.id) === (tech.icon ?? tech.id)) === index);
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {stack.map((chip) => (
        <li key={chip.label} className="glass flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm text-foreground">
          <span aria-hidden className="flex items-center gap-1">
            {icons(chip.technologies).map((tech) => (
              <TechnologyIcon key={tech.id} icon={tech.icon} category={tech.category} className="size-4" />
            ))}
          </span>
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
