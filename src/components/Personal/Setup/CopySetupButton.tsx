"use client";

import { useState } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";

import { components } from "@/data/SetupData";
import { formatSetupToMarkdown } from "@/utils/formatSetupToMarkdown";

/**
 * A button component that copies the setup configuration to the clipboard in Markdown format.
 * Uses `navigator.clipboard` API.
 *
 * @returns A JSX.Element button.
 */
export default function CopySetupButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const markdown = formatSetupToMarkdown(components);
    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy setup to clipboard", err);
      });
  };

  return (
    <button aria-label="Copiar setup como Markdown" className="btn btn-sm btn-outline gap-2 mb-4" type="button" onClick={handleCopy}>
      {copied ? <FaCheck size={16} /> : <FaCopy size={16} />}
      {copied ? "Copiado!" : "Copiar Setup (Markdown)"}
    </button>
  );
}
