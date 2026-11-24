"use client";

import { useEffect, useState } from "react";

import { MotionButton } from "@/components/motion/motion-button";
import { CopyStateIcon } from "@/components/motion/state-icons";

/** How long the check stays before the button offers to copy again. */
const DONE_FOR = 1500;

/** Copies the setup, already formatted as Markdown on the server, to the clipboard. */
export function SetupCopyButton({ markdown, label, done }: { markdown: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => {
      setCopied(false);
    }, DONE_FOR);
    return () => {
      clearTimeout(timer);
    };
  }, [copied]);
  return (
    <MotionButton
      variant="outline"
      size="sm"
      data-state={copied ? "copied" : "idle"}
      onClick={() => {
        void navigator.clipboard.writeText(markdown).then(() => {
          setCopied(true);
        });
      }}
    >
      <CopyStateIcon copied={copied} />
      <span aria-live="polite">{copied ? done : label}</span>
    </MotionButton>
  );
}
