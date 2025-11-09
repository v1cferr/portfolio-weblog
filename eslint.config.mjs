// NOTA: É necessário instalar os seguintes pacotes:
// pnpm add -D @eslint/js @eslint/eslintrc eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-jsx-a11y eslint-plugin-jsdoc eslint-plugin-react

// Importação de módulos necessários para a configuração do ESLint
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
import jsdoc from "eslint-plugin-jsdoc";
import react from "eslint-plugin-react";

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
        project: "./tsconfig.json", // Adiciona a configuração do TypeScript para habilitar regras que precisam de type-checking
        projectService: true, // Habilita o serviço de projeto do TypeScript
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Adiciona as regras recomendadas para React Hooks em formato flat config
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
    // Define os tipos de arquivos aos quais aplicar estas regras
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "jsx-a11y": jsxA11y,
      jsdoc: jsdoc,
      react: react,
    },
    rules: {
      // =================================================
      // REGRAS DE TRATAMENTO DE ERROS
      // =================================================

      // Avisa sobre console.log mas permite console.warn e console.error
      // Útil para evitar logs desnecessários em produção
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // DESATIVADO: Estava causando falsos positivos com o React em arquivos Next.js
      // Considera erros globais definidos pelo framework mas não explicitamente importados
      "no-undef": "off",

      // MODIFICADO: Alterado de error para warn para facilitar o desenvolvimento
      // Marca variáveis não utilizadas como aviso, mas ignora as que começam com _
      // Convenção para indicar variáveis intencionalmente não utilizadas
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // =================================================
      // REGRAS DE ESTILO E CSS
      // =================================================

      // Proíbe o uso de estilos inline para manter a separação de preocupações
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

      // Ordena as props do JSX para melhor legibilidade
      // Ex: primeiro props curtos, depois callbacks no final
      "react/jsx-sort-props": ["warn", { callbacksLast: true, shorthandFirst: true }],

      // Força componentes sem filhos a serem auto-fechados
      // Ex: <div /> em vez de <div></div> quando não há conteúdo
      "react/self-closing-comp": "warn",

      // Proíbe o uso de dangerouslySetInnerHTML para segurança
      "react/no-danger": "error",

      // Avisa sobre o uso de índices como chaves (causa problemas de performance e bugs)
      "react/no-array-index-key": "warn",

      // =================================================
      // REGRAS DE ACESSIBILIDADE
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
      // REGRAS ESPECÍFICAS PARA NEXT.JS
      // =================================================

      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-title-in-document-head": "warn",

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

      "import/no-unresolved": "off",

      // =================================================
      // REGRAS DE PERFORMANCE
      // =================================================

      "react/jsx-no-useless-fragment": "warn",
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

      // Evita afirmações não nulas (!) que podem causar erros em runtime
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Evita condições desnecessárias que TypeScript já pode verificar
      "@typescript-eslint/no-unnecessary-condition": "warn",

      // Evita promessas não tratadas
      "@typescript-eslint/no-floating-promises": "warn",

      // Garante que await seja usado apenas com Promises
      "@typescript-eslint/await-thenable": "error",

      // Evita uso incorreto de Promises
      "@typescript-eslint/no-misused-promises": "warn",

      // Preferir o operador de coalescência nula (??) em vez de OR (||)
      "@typescript-eslint/prefer-nullish-coalescing": "warn",

      // Preferir o operador de encadeamento opcional (?.)
      "@typescript-eslint/prefer-optional-chain": "warn",
    },
  },
];

export default eslintConfig;
