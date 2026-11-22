import nextVitals from "eslint-config-next/core-web-vitals";

import { base } from "./base.js";

/** Rules for the Next.js app: the shared base plus Next, React, hooks and jsx-a11y. */
export const next = [
  // Next's config first: it sets its own parser, and the typescript-eslint
  // parser from the base must win for type-aware rules to work.
  ...nextVitals,
  ...base,
  {
    rules: {
      "react/jsx-no-target-blank": "error",
      "jsx-a11y/anchor-is-valid": "error",
    },
  },
];

export default next;
