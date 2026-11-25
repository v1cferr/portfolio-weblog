import "server-only";

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Separator } from "@workspace/ui/components/separator";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import Image from "next/image";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ComponentProps, ReactNode } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { Link } from "@/i18n/navigation";
import { ExternalLink } from "@/components/external-link";
import { Lightbox, LightboxTrigger } from "@/components/lightbox/lightbox";
import { galleryId } from "@/components/lightbox/photo-param";
import { onSiteDecisionPath } from "@/lib/decision-links";
import { isExternalUrl } from "@/lib/site";

function Callout({ title, tone = "note", children }: { title?: string; tone?: "note" | "warning"; children: ReactNode }) {
  return (
    <Alert variant={tone === "warning" ? "destructive" : "default"} className="my-6 not-prose">
      {tone === "warning" ? <TriangleAlertIcon /> : <InfoIcon />}
      {title !== undefined && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="[&_p]:leading-relaxed">{children}</AlertDescription>
    </Alert>
  );
}

/**
 * An image in a post. MDX blocks JS expressions, so the intrinsic size comes
 * in as strings; it reserves the space so the text does not jump on load.
 * Each figure is a lightbox of its own, named after the file
 * (`?photo=figure-<file>-1`).
 */
function Figure({ src, alt, caption, width, height }: { src: string; alt: string; caption?: string; width: string; height: string }) {
  const id = galleryId(`figure-${src.replace(/^.*\//, "").replace(/\.\w+$/, "")}`);
  return (
    <figure className="not-prose my-8 space-y-2">
      <Lightbox id={id} items={[{ src, alt, caption, width: Number(width), height: Number(height) }]}>
        <LightboxTrigger index={0} className="block overflow-hidden rounded-lg border bg-muted">
          <Image
            src={src}
            alt={alt}
            width={Number(width)}
            height={Number(height)}
            sizes="(min-width: 768px) 720px, 100vw"
            className="h-auto w-full"
          />
        </LightboxTrigger>
      </Lightbox>
      {caption !== undefined && <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

function Anchor({ href = "", ...props }: ComponentProps<"a">) {
  // Internal links go through the i18n Link so they keep the reader's locale.
  if (href.startsWith("/")) return <Link href={href} {...props} />;
  // This site's own ADRs, written as GitHub URLs, open in its decision log.
  const decision = onSiteDecisionPath(href);
  if (decision !== undefined) return <Link href={decision} {...props} />;
  if (isExternalUrl(href)) return <ExternalLink href={href} {...props} />;
  return <a href={href} {...props} />;
}

/** Elements and components an article may use. Everything maps onto the design system. */
const components = {
  a: Anchor,
  hr: () => <Separator className="my-10" />,
  Callout,
  Figure,
};

/**
 * A wide table scrolls inside its own box instead of the page, and the box
 * takes focus so the keyboard can scroll it too.
 */
function Table(props: ComponentProps<"table">) {
  return (
    <div tabIndex={0} className="not-prose my-6 overflow-x-auto rounded-lg border">
      <table {...props} className="w-full text-left font-mono text-xs [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3 [&_th]:py-2 [&_tr]:border-b" />
    </div>
  );
}

/**
 * Compiles a post body. Posts are local files reviewed in Git; JS expressions
 * stay blocked (the next-mdx-remote default) so MDX can only compose the
 * components listed above. `format: "md"` reads plain Markdown (the decision
 * records), where a stray `<` or `{` is text, not JSX; it also scrolls wide
 * tables in their own box.
 */
export async function renderMdx(source: string, { format = "mdx" }: { format?: "mdx" | "md" } = {}) {
  const { content } = await compileMDX({
    source,
    components: format === "md" ? { ...components, table: Table } : components,
    options: {
      blockJS: true,
      mdxOptions: {
        format,
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["heading-anchor"] } }],
          [rehypePrettyCode, { theme: { light: "github-light", dark: "github-dark-dimmed" }, keepBackground: false }],
        ],
      },
    },
  });
  return content;
}

/** About 220 words a minute for technical prose. */
export function readingMinutes(source: string): number {
  const words = source
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
