import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  {
    name: "mairouter/javascript-recommended",
    files: ["**/*.{js,jsx,mjs,cjs}"],
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
    },
  },
  {
    name: "mairouter/nextjs",
    files: ["src/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    extends: [nextVitals],
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    name: "mairouter/node-esm",
    files: [
      "open-sse/**/*.{js,mjs}",
      "tests/**/*.{js,mjs}",
      "scripts/**/*.mjs",
      "*.config.mjs",
    ],
    languageOptions: {
      sourceType: "module",
      globals: globals.node,
    },
  },
  {
    name: "mairouter/node-commonjs",
    files: ["cli/**/*.js", "scripts/**/*.js", "custom-server.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    name: "mairouter/vitest",
    files: ["tests/**/*.test.js"],
    languageOptions: {
      globals: globals.vitest,
    },
  },
  {
    name: "mairouter/service-worker",
    files: ["public/sw.js"],
    languageOptions: {
      sourceType: "script",
      globals: globals.serviceworker,
    },
  },
  {
    name: "mairouter/linter-options",
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  globalIgnores([
    // Next.js and build output.
    ".next/**",
    ".next-cli-build/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "product/**",
    ".vercel/**",

    // Generated CLI bundles and dependencies.
    "cli/.build-home/**",
    "cli/app/**",
    "cli/node_modules/**",
    "node_modules/**",

    // Local tooling, runtime data, and archived source trees.
    ".claude/**",
    "data/**",
    "logs/**",
    "source/**",
    "open-sse.old/**",
    "graphify-out/**",
    "docs/**",
  ]),
]);

export default eslintConfig;
