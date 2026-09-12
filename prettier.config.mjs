/**
 * Prettier configuration, keeping formatting consistent across the project
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  // =================================================
  // BASIC SETTINGS
  // =================================================

  // Maximum line width before wrapping
  printWidth: 140,

  // Indentation width (2 spaces is the common default in Next.js/React projects)
  tabWidth: 2,

  // Indent with spaces rather than tabs
  useTabs: false,

  // Terminate statements with a semicolon
  semi: true,

  // Use double quotes rather than single quotes
  singleQuote: false,

  // When to quote object properties
  // "as-needed" = only where required
  // "consistent" = quote them all if any one needs quoting
  // "preserve" = leave them as written
  quoteProps: "as-needed",

  // Quote style inside JSX (independent of singleQuote)
  jsxSingleQuote: false,

  // =================================================
  // COMMAS AND PUNCTUATION
  // =================================================

  // Trailing commas where valid
  // "es5" = wherever ES5 allows them (objects, arrays, but not function parameters)
  // "all" = everywhere possible, function parameters included
  // "none" = never
  trailingComma: "es5",

  // =================================================
  // SPACING
  // =================================================

  // Spaces inside object braces
  // { foo: bar } rather than {foo: bar}
  bracketSpacing: true,

  // Placement of > on multi-line JSX elements
  // false = put > on its own line
  // true = keep > at the end of the last line
  bracketSameLine: false,

  // =================================================
  // ARROW FUNCTIONS
  // =================================================

  // Parentheses around a single arrow function parameter
  // "always" = always parenthesize: (x) => x
  // "avoid" = omit where possible: x => x
  arrowParens: "always",

  // =================================================
  // LINE ENDINGS
  // =================================================

  // Line ending style
  // "lf" = Line Feed (\n), the Unix/Linux/Mac convention
  // "crlf" = Carriage Return + Line Feed (\r\n), the Windows convention
  // "cr" = Carriage Return (\r), the classic Mac convention
  // "auto" = keep whatever the file already uses
  endOfLine: "lf",

  // Newline at the end of the file
  // Note: this is driven by EditorConfig, kept here for reference
  // insertFinalNewline: true,

  // =================================================
  // HTML, CSS AND MARKDOWN
  // =================================================

  // How whitespace is treated in HTML
  // "css" = respect the CSS display property
  // "strict" = format every element as block or inline
  // "ignore" = do not format whitespace
  htmlWhitespaceSensitivity: "css",

  // Whether markdown prose is rewrapped to printWidth
  // "always" = always wrap
  // "never" = never wrap
  // "preserve" = leave as written
  proseWrap: "preserve",

  // =================================================
  // COMMENTS
  // =================================================

  // Tries to preserve the original formatting of comments, so Prettier does not
  // reflow them in unwanted ways
  // (available from version 3.1.0)
  // experimentalTernaries: false,

  // =================================================
  // PLUGINS AND CUSTOM PARSERS
  // =================================================

  // Additional plugins go here
  plugins: [],

  // =================================================
  // OVERRIDES - PER FILE TYPE SETTINGS
  // =================================================

  overrides: [
    // JSON files
    {
      files: ["*.json", ".prettierrc", ".eslintrc"],
      options: {
        tabWidth: 2,
        printWidth: 100,
      },
    },
    // YAML files
    {
      files: ["*.yml", "*.yaml"],
      options: {
        tabWidth: 2,
      },
    },
    // Markdown files
    {
      files: ["*.md", "*.mdx"],
      options: {
        proseWrap: "always",
        printWidth: 80,
      },
    },
    // Configuration files
    {
      files: ["*.config.js", "*.config.mjs", "*.config.ts"],
      options: {
        printWidth: 100,
      },
    },
  ],
};

export default config;
