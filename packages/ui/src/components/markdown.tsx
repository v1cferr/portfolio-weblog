import { cn } from "cn";
import { marked } from "marked";
import { memo, useId, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/*
 * Markdown, from prompt-kit (https://www.prompt-kit.com, MIT), added with
 * `shadcn add https://www.prompt-kit.com/c/markdown.json`. The text is split
 * into top-level blocks (marked's lexer), each rendered and memoized on its
 * own, so a streamed answer re-renders only its last block. Adapted:
 * - no raw HTML, ever: `skipHtml` drops it and react-markdown's default URL
 *   transform already neutralizes `javascript:` and other unsafe links;
 * - GitHub Flavored Markdown (lists, tables, strikethrough) without
 *   remark-breaks: a single newline stays a space, as in Markdown;
 * - no syntax highlighting (prompt-kit's CodeBlock pulls Shiki into the
 *   browser): code is plain monospace, inline or in a block.
 */

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  return marked.lexer(markdown).map((token) => token.raw);
}

const DEFAULT_COMPONENTS: Partial<Components> = {
  code: function Code({ className, children, node: _node, ...props }) {
    return (
      <code className={cn("rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: function Pre({ children, node: _node, ...props }) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs [&>code]:bg-transparent [&>code]:p-0" {...props}>
        {children}
      </pre>
    );
  },
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({ content, components }: { content: string; components: Partial<Components> }) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {content}
      </ReactMarkdown>
    );
  },
  (previous, next) => previous.content === next.content && previous.components === next.components
);

function MarkdownComponent({ children, id, className, components }: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);
  const merged = useMemo(() => ({ ...DEFAULT_COMPONENTS, ...components }), [components]);

  return (
    <div data-slot="markdown" className={className}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock key={`${blockId}-block-${String(index)}`} content={block} components={merged} />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = "Markdown";

export { Markdown };
