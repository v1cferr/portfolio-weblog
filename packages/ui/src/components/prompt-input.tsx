"use client";

import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "cn";
import * as React from "react";

/*
 * PromptInput, from prompt-kit (https://www.prompt-kit.com, MIT), added with
 * `shadcn add https://www.prompt-kit.com/c/prompt-input.json`: a box that
 * holds an auto-growing textarea and its actions (send, stop). Enter sends,
 * Shift+Enter starts a new line. Adapted:
 * - the textarea grows with its content up to `maxHeight`, then scrolls;
 * - a tap anywhere on the box focuses the textarea without scrolling the page
 *   (`preventScroll`), which on phones would otherwise move the page under
 *   the sheet;
 * - the per-action tooltips are left out: every action here has a visible
 *   label or an accessible name, and the site's tooltips need a provider
 *   higher up anyway;
 * - styled with the site's input tokens instead of the upstream pill.
 */

type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: (() => void) | undefined;
  disabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

const PromptInputContext = React.createContext<PromptInputContextType | null>(null);

function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (context === null) throw new Error("PromptInput parts need a <PromptInput>");
  return context;
}

export type PromptInputProps = {
  isLoading?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
} & React.ComponentProps<"div">;

function PromptInput({
  className,
  isLoading = false,
  maxHeight = 200,
  value,
  onValueChange,
  onSubmit,
  children,
  disabled = false,
  onClick,
  ...props
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const context = React.useMemo(
    () => ({ isLoading, value, setValue: onValueChange, maxHeight, onSubmit, disabled, textareaRef }),
    [isLoading, value, onValueChange, maxHeight, onSubmit, disabled]
  );

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    // Only taps on the box itself: a button inside keeps its own focus.
    if (!disabled && event.target === event.currentTarget) textareaRef.current?.focus({ preventScroll: true });
    onClick?.(event);
  };

  return (
    <PromptInputContext.Provider value={context}>
      <div
        data-slot="prompt-input"
        onClick={handleClick}
        className={cn(
          "cursor-text rounded-xl border border-input bg-input/30 p-1.5 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

export type PromptInputTextareaProps = React.ComponentProps<typeof Textarea>;

function PromptInputTextarea({ className, onKeyDown, ref, ...props }: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled, textareaRef } = usePromptInput();

  // Grows with the text up to maxHeight, then scrolls inside.
  React.useLayoutEffect(() => {
    const el = textareaRef.current;
    if (el === null) return;
    el.style.height = "auto";
    el.style.height =
      typeof maxHeight === "number"
        ? `${String(Math.min(el.scrollHeight, maxHeight))}px`
        : `min(${String(el.scrollHeight)}px, ${maxHeight})`;
  }, [value, maxHeight, textareaRef]);

  const handleRef = (el: HTMLTextAreaElement | null) => {
    textareaRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // Enter sends; Shift+Enter, and Enter while composing (IME), do not.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Textarea
      ref={handleRef}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
      onKeyDown={handleKeyDown}
      rows={1}
      disabled={disabled}
      className={cn(
        "min-h-11 w-full resize-none border-none bg-transparent px-2 py-2.5 shadow-none outline-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  );
}

export type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({ children, className, ...props }: PromptInputActionsProps) {
  return (
    <div data-slot="prompt-input-actions" className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

export { PromptInput, PromptInputActions, PromptInputTextarea, usePromptInput };
