import globals from "globals";
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js globals
      },
      ecmaVersion: "latest",
      sourceType: "commonjs", // Support for Node.js `require` and `module.exports`
    },
    ...js.configs.recommended, // For plain JavaScript
    rules: {
      "no-unused-vars": "warn", // Warn instead of error for unused variables
      "no-undef": "off", // Turn off undefined checks for Node.js globals
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser, // Browser-specific globals
        ...globals.node, // Node.js globals
      },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "no-undef": "off", // Disable no-undef for Node.js compatibility
    },
  },
];
