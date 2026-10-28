import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "coverage/**",
    "playwright-report/**",
    "reports/**",
    ".stryker-tmp/**",
    "test-results/**",
    ".lighthouse/**",
    ".lighthouseci/**",
    ".vercel/**",
    "next-env.d.ts",
  ]),
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      complexity: ["error", 10],
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      "max-lines": ["error", 250],
      "max-params": ["error", 4],
      "max-depth": ["error", 4],
    },
  },
]);

export default eslintConfig;
