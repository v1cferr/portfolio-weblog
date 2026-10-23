import "server-only";

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Separator } from "@workspace/ui/components/separator";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ComponentProps, ReactNode } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { Link } from "@/i18n/navigation";

function Callout({ title, tone = "note", children }: { title?: string; tone?: "note" | "warning"; children: ReactNode }) {
  return (
    <Alert variant={tone === "warning" ? "destructive" : "default"} className="my-6 not-prose">
      {tone === "warning" ? <TriangleAlertIcon /> : <InfoIcon />}
      {title !== undefined && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="[&_p]:leading-relaxed">{children}</AlertDescription>
    </Alert>
  );
}

function Anchor({ href = "", ...props }: ComponentProps<"a">) {
  // Internal links go through the i18n Link so they keep the reader's locale.
  if (href.startsWith("/")) return <Link href={href} {...props} />;
  return <a href={href} {...props} />;
}

/** Elements and components an article may use. Everything maps onto the design system. */
const components = {
  a: Anchor,
  hr: () => <Separator className="my-10" />,
  Callout,
};

/**
 * Compiles a post body. Posts are local files reviewed in Git; JS expressions
 * stay blocked (the next-mdx-remote default) so MDX can only compose the
 * components listed above.
 */
export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      blockJS: true,
      mdxOptions: {
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
