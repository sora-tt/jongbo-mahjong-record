import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import tsParser from "@typescript-eslint/parser";

const compat = new FlatCompat();

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "docs/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: true,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "no-undef": "off",
      // --- React ---
      "no-unused-vars": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],

      // --- TypeScript ---
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",

      // --- import order ---
      "import/order": [
        "error",
        {
          groups: [
            ["builtin"],
            ["external"],
            ["internal"],
            ["parent", "sibling", "index"],
            ["type"],
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before"
            },
            {
              pattern: "next/**",
              group: "external",
              position: "after"
            },
            {
              pattern: "@/components/**",
              group: "internal",
              position: "after"
            },
            {
              pattern: "@/utils/**",
              group: "internal",
              position: "after"
            },
            {
              pattern: "**/*.css",
              group: "index",
              position: "after"
            }
          ],
          pathGroupsExcludedImportTypes: ["react"]
        }
      ],

      "import/newline-after-import": ["error", { count: 1 }],

      "prettier/prettier": [
        "error",
        {
          endOfLine: "lf",
          tabWidth: 2,
          semi: true,
          singleQuote: false,
          trailingComma: "es5",
        },
      ],
    },
  },
];

export default eslintConfig;
