import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules for code quality
  {
    rules: {
      // Warn on explicit any usage to improve type safety
      // Goal: convert to "error" once violations are addressed
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
