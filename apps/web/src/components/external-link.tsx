import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

type ExternalLinkProps = Omit<ComponentProps<"a">, "target"> & {
  /** Marks a profile of the site's owner (rel="me"), for IndieWeb verification. */
  me?: boolean;
};

/**
 * A link that leaves the site. It opens in a new tab with no `window.opener`
 * and no Referer, and says so to screen readers, since a new tab otherwise
 * arrives without warning (WCAG technique G201).
 */
export function ExternalLink({ me = false, rel, children, "aria-label": ariaLabel, ...props }: ExternalLinkProps) {
  const t = useTranslations("Common");
  const note = t("opensInNewTab");
  return (
    <a
      {...props}
      target="_blank"
      rel={[me ? "me" : undefined, "noopener noreferrer", rel].filter(Boolean).join(" ")}
      aria-label={ariaLabel === undefined ? undefined : `${ariaLabel} (${note})`}
    >
      {children}
      {ariaLabel === undefined && <span className="sr-only"> ({note})</span>}
    </a>
  );
}
