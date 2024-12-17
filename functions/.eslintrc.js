module.exports = {
  root: true,
  env: {
    node: true, // Enables Node.js global variables like `require`, `module`, and `exports`
    es2020: true, // Supports modern ES features
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended", // Base ESLint rules
    "plugin:@typescript-eslint/recommended", // TypeScript ESLint rules
  ],
  rules: {
    "no-undef": "off", // Disable 'no-undef' for Node.js global variables
    "no-unused-vars": "warn", // Warn instead of error for unused variables
    "@typescript-eslint/no-unused-vars": "warn",
  },
};
