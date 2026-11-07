import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    globals: true,
    unstubGlobals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/app/**"],
      reporter: ["text-summary", "text", "html", "lcov"],
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
