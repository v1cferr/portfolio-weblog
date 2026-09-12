// NOTE: the following packages must be installed:
// pnpm add -D @eslint/js @eslint/eslintrc eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-jsx-a11y eslint-plugin-jsdoc eslint-plugin-react

// Modules required by this ESLint configuration
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
import jsdoc from "eslint-plugin-jsdoc";
import react from "eslint-plugin-react";

// Compatibility layer for the legacy ESLint configuration format
// Lets 'next' and 'prettier' extends be used from the flat config
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  // Resolves the plugins that come in through FlatCompat
  recommendedConfig: { plugins: {} },
});

const eslintConfig = [
  // The Supabase edge functions target Deno and carry their own tsconfig, and
  // the root tsconfig.json excludes them, so the type-aware rules below cannot
  // parse them. `next lint` never walked into these files; `eslint .` does.
  {
    ignores: ["supabase/**", ".next/**"],
  },

  // ESLint recommended baseline
  js.configs.recommended,

  // Next.js and Prettier configurations
  // Prettier must come last so it can switch off conflicting rules
  ...compat.config({
    extends: ["next", "prettier"],
  }),

  // TypeScript setup
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json", // Points at the TS project so type-aware rules can run
        // projectService: true, // Enables the TypeScript project service
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React Hooks recommended rules, in flat config form
  {
    plugins: {
      "react-hooks": reactHooks,
      react: react,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },

  {
    // File types these rules apply to
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "jsx-a11y": jsxA11y,
      jsdoc: jsdoc,
      react: react,
    },
    rules: {
      // =================================================
      // ERROR HANDLING RULES
      // =================================================

      // Warns on console.log but allows console.warn and console.error,
      // which keeps stray logs out of production
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // DISABLED: it was reporting false positives for React in Next.js files,
      // flagging framework globals that are never imported explicitly
      "no-undef": "off",

      // MODIFIED: downgraded from error to warn to keep development moving.
      // Unused variables warn, except those prefixed with _, the convention
      // for marking a variable as intentionally unused
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // =================================================
      // STYLE AND CSS RULES
      // =================================================

      // Forbids inline styles, keeping presentation out of the markup
      "react/forbid-component-props": [
        "error",
        {
          forbid: [
            {
              propName: "style",
              message: "Use CSS classes instead of inline styles",
            },
          ],
        },
      ],
      "react/forbid-dom-props": [
        "error",
        {
          forbid: [
            {
              propName: "style",
              message: "Use CSS classes instead of inline styles",
            },
          ],
        },
      ],

      // =================================================
      // CODE ORGANISATION RULES
      // =================================================

      // Consistent imports.
      // Avoids importing the same module twice
      "import/no-duplicates": "error",

      // Groups imports and alphabetises them
      "import/order": [
        "warn",
        {
          // Order of the import groups
          groups: [
            "builtin", // Node.js built-ins (fs, path, ...)
            "external", // npm packages (react, next, ...)
            "internal", // Project-internal imports (absolute paths)
            "parent", // Imports from a parent directory (../)
            "sibling", // Imports from the same directory (./)
            "index", // Index file imports
            "object", // Object imports
            "type", // Type imports
          ],
          // Blank line between groups
          "newlines-between": "always",
          // Alphabetical, case insensitive
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // =================================================
      // REACT SPECIFIC RULES
      // =================================================

      // PropTypes are unnecessary: the project is typed with TypeScript
      "react/prop-types": "off",

      // Sorts JSX props for readability:
      // shorthand props first, callbacks last
      "react/jsx-sort-props": ["warn", { callbacksLast: true, shorthandFirst: true }],

      // Requires childless components to be self-closing,
      // e.g. <div /> rather than <div></div>
      "react/self-closing-comp": "warn",

      // Forbids dangerouslySetInnerHTML, for safety
      "react/no-danger": "error",

      // Warns on array indexes as keys, a source of bugs and wasted renders
      "react/no-array-index-key": "warn",

      // =================================================
      // ACCESSIBILITY RULES
      // =================================================

      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/media-has-caption": "warn",

      // =================================================
      // NEXT.JS SPECIFIC RULES
      // =================================================

      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-title-in-document-head": "warn",

      // =================================================
      // COMMENT RULES
      // =================================================

      "jsdoc/require-jsdoc": [
        "warn",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: false,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
          },
        },
      ],

      // =================================================
      // NAMING CONVENTION RULES
      // =================================================

      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "interface",
          format: ["PascalCase"],
          prefix: ["I"],
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
      ],

      // =================================================
      // IMPORT ALIAS RULES
      // =================================================

      "import/no-unresolved": "off",

      // =================================================
      // PERFORMANCE RULES
      // =================================================

      "react/jsx-no-useless-fragment": "warn",
    },
  },

  // Rules that only apply to .ts/.tsx files
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // =================================================
      // TYPESCRIPT SPECIFIC RULES
      // =================================================

      // Warns on 'any', nudging towards a precise type
      "@typescript-eslint/no-explicit-any": "warn",

      // Explicit return types are not required:
      // inference gets it right in the vast majority of cases
      "@typescript-eslint/explicit-function-return-type": "off",

      // Explicit types are not required on public APIs either
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Encourages consistent type imports,
      // e.g. import type { MyType } from './types'
      "@typescript-eslint/consistent-type-imports": "warn",

      // Discourages non-null assertions (!), which can blow up at runtime
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Flags conditions TypeScript can already prove redundant
      "@typescript-eslint/no-unnecessary-condition": "warn",

      // Flags unhandled promises
      "@typescript-eslint/no-floating-promises": "warn",

      // Ensures await is only used on thenables
      "@typescript-eslint/await-thenable": "error",

      // Flags misused promises
      "@typescript-eslint/no-misused-promises": "warn",

      // Prefers nullish coalescing (??) over logical or (||)
      "@typescript-eslint/prefer-nullish-coalescing": "warn",

      // Prefers optional chaining (?.)
      "@typescript-eslint/prefer-optional-chain": "warn",
    },
  },
];

export default eslintConfig;
