"use client";

import { cn } from "cn";
import type * as React from "react";
import { StickToBottom, type StickToBottomContext, type StickToBottomProps } from "use-stick-to-bottom";

/*
 * ChatContainer, from prompt-kit (https://www.prompt-kit.com, MIT), added with
 * `shadcn add https://www.prompt-kit.com/c/chat-container.json`. It scrolls
 * only its own message list (use-stick-to-bottom sets scrollTop, never
 * scrollIntoView, so no ancestor moves), keeps the view pinned while content
 * grows, and lets go as soon as the reader scrolls up. Adapted:
 * - no `role="log"`: a log is a live region, and a chat that reads every
 *   streamed word out loud is noise; the page announces state changes itself;
 * - the root is `relative` and clips, so absolutely positioned children (the
 *   sr-only spans) stay inside it, and the scroll happens in the inner element
 *   (`scrollClassName`), which keeps its overscroll to itself;
 * - the library's options (`resize`, `initial`, `targetScrollTop`, `contextRef`)
 *   pass through.
 */

export type ChatContainerRootProps = StickToBottomProps & { className?: string };

export type ChatContainerContentProps = StickToBottom.ContentProps & { className?: string };

function ChatContainerRoot({ children, className, resize = "smooth", initial = "instant", ...props }: ChatContainerRootProps) {
  return (
    <StickToBottom
      data-slot="chat-container"
      className={cn("relative flex min-h-0 overflow-clip", className)}
      resize={resize}
      initial={initial}
      {...props}
    >
      {children}
    </StickToBottom>
  );
}

function ChatContainerContent({ children, className, scrollClassName, ...props }: ChatContainerContentProps) {
  return (
    <StickToBottom.Content
      data-slot="chat-container-content"
      className={cn("relative flex w-full flex-col", className)}
      scrollClassName={cn("overflow-y-auto overscroll-contain", scrollClassName)}
      {...props}
    >
      {children}
    </StickToBottom.Content>
  );
}

/** The list's handle (`contextRef`): `scrollToBottom`, `isAtBottom` and the rest. */
export type ChatContainerContext = StickToBottomContext;

export { ChatContainerContent, ChatContainerRoot };
