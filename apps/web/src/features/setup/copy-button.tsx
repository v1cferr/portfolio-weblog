"use client";

import { Button } from "@workspace/ui/components/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

/** Copies the setup, already formatted as Markdown on the server, to the clipboard. */
export function SetupCopyButton({ markdown, label, done }: { markdown: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(markdown).then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        });
      }}
    >
      {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
      <span aria-live="polite">{copied ? done : label}</span>
    </Button>
  );
}
