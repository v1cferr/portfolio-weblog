# @workspace/config

Shared TypeScript presets and ESLint flat configs, so every workspace lints and
type-checks the same way.

- `typescript/base.json`: strict settings used everywhere.
- `typescript/library.json`: Node-side packages (`content`, `github`, `search`).
- `typescript/nextjs.json`: the Next.js app.
- `eslint/base`: typescript-eslint `strictTypeChecked` plus Prettier
  compatibility.
- `eslint/next`: the base plus `eslint-config-next` (React, hooks, jsx-a11y,
  Core Web Vitals).
