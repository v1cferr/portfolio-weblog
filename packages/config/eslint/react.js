import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import { base } from "./base.js";

/** Rules for React libraries that are not a Next.js app (the design system). */
export const react = [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  reactHooks.configs.flat.recommended,
];

export default react;
