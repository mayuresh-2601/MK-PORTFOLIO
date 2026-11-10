import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "build",
    "coverage",
    "node_modules",
  ]),

  {
    files: ["**/*.{js,jsx}"],

    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },

      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    plugins: {
      react,
    },

    rules: {
      // General
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Mark JSX component usage so no-unused-vars does not report
      // components that are only referenced in JSX.
      "react/jsx-uses-vars": "error",

      "no-console":
        process.env.NODE_ENV === "production"
          ? "warn"
          : "off",

      // React
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
    },
  },
]);