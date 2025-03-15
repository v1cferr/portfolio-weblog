// NOTA: É necessário instalar os seguintes pacotes:
// pnpm add -D @eslint/js @eslint/eslintrc eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-jsx-a11y eslint-plugin-jsdoc

// Importação de módulos necessários para a configuração do ESLint
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
import jsdoc from "eslint-plugin-jsdoc";

// Compatibilidade para configurações antigas do ESLint
// Permite usar extensões como 'next' e 'prettier' no formato flat config
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  // Adiciona resolução de plugins que serão importados através do FlatCompat
  recommendedConfig: { plugins: {} },
});

const eslintConfig = [
  // Configurações básicas recomendadas do ESLint
  js.configs.recommended,

  // Adiciona configurações do Next.js e Prettier
  // O Prettier deve vir por último para evitar conflitos com outras regras
  ...compat.config({
    extends: ["next", "prettier"],
  }),

  // Configuração para TypeScript
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
      },
    },
  },

  // Adiciona as regras recomendadas para React Hooks em formato flat config
  {
    plugins: {
      // Nome do plugin como chave, plugin importado como valor
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  {
    // Define os tipos de arquivos aos quais aplicar estas regras
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "jsx-a11y": jsxA11y,
      jsdoc: jsdoc,
    },
    rules: {
      // =================================================
      // REGRAS DE TRATAMENTO DE ERROS
      // =================================================

      // Avisa sobre console.log mas permite console.warn e console.error
      // Útil para evitar logs desnecessários em produção
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Marca variáveis não utilizadas como erro, mas ignora as que começam com _
      // Convenção para indicar variáveis intencionalmente não utilizadas
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // =================================================
      // REGRAS DE ORGANIZAÇÃO DE CÓDIGO
      // =================================================

      // Regras para importações consistentes
      // Evita duplicação de imports (import React from 'react' várias vezes)
      "import/no-duplicates": "error",

      // Organiza os imports em grupos e em ordem alfabética
      "import/order": [
        "warn",
        {
          // Define a ordem dos grupos de importação
          groups: [
            "builtin", // Módulos nativos do Node.js (ex: fs, path)
            "external", // Pacotes npm (ex: react, next)
            "internal", // Importações internas do projeto (caminhos absolutos)
            "parent", // Importações do diretório pai (ex: ../)
            "sibling", // Importações do mesmo diretório (ex: ./)
            "index", // Importações do arquivo index
            "object", // Importações de objetos
            "type", // Importações de tipos
          ],
          // Adiciona linha em branco entre os grupos
          "newlines-between": "always",
          // Organiza em ordem alfabética, ignorando maiúsculas/minúsculas
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // =================================================
      // REGRAS ESPECÍFICAS PARA REACT
      // =================================================

      // Desativa a verificação de PropTypes (usamos TypeScript)
      "react/prop-types": "off",

      // Não é mais necessário importar React desde o React 17
      "react/react-in-jsx-scope": "off",

      // Ordena as props do JSX para melhor legibilidade
      // Ex: primeiro props curtos, depois callbacks no final
      "react/jsx-sort-props": [
        "warn",
        { callbacksLast: true, shorthandFirst: true },
      ],

      // Força componentes sem filhos a serem auto-fechados
      // Ex: <div /> em vez de <div></div> quando não há conteúdo
      "react/self-closing-comp": "warn",

      // =================================================
      // REGRAS DE ACESSIBILIDADE
      // =================================================

      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",

      // =================================================
      // REGRAS ESPECÍFICAS PARA NEXT.JS
      // =================================================

      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",

      // =================================================
      // REGRAS DE COMENTÁRIOS
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
      // REGRAS DE CONVENÇÕES DE NOMES
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
      // REGRAS DE ALIAS DE IMPORTAÇÃO
      // =================================================

      // "import/no-relative-parent-imports": "warn",
      "import/no-unresolved": "off",

      // =================================================
      // REGRAS DE PERFORMANCE
      // =================================================

      "react/no-array-index-key": "warn",
      "react/jsx-no-useless-fragment": "warn",

      // =================================================
      // REGRAS DE DETECÇÃO DE ARQUIVOS NÃO UTILIZADOS
      // =================================================

      "import/no-unused-modules": [
        "warn",
        {
          unusedExports: true,
        },
      ],
    },
  },

  // Regras específicas para TypeScript em arquivos .ts/.tsx
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // =================================================
      // REGRAS ESPECÍFICAS PARA TYPESCRIPT
      // =================================================

      // Avisa sobre o uso de 'any' - incentiva tipagem mais precisa
      "@typescript-eslint/no-explicit-any": "warn",

      // Desativa a necessidade de declarar tipo de retorno explícito
      // O TypeScript já infere os tipos corretamente na maioria dos casos
      "@typescript-eslint/explicit-function-return-type": "off",

      // Desativa a necessidade de tipos explícitos para APIs públicas
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Incentiva o uso de imports de tipos consistentes
      // Ex: import type { MyType } from './types'
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
];

export default eslintConfig;
