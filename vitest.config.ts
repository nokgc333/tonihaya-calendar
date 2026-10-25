import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // JSX は自動ランタイム（react/jsx-runtime）で変換する。これで各 .tsx で React の
  // 明示 import が不要になる（domain の .ts テストには影響しない）。
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    globals: true,
    unstubGlobals: true,
    // 既定は node（domain 用・高速）。UI 層の .test.tsx は各ファイル先頭の
    // `// @vitest-environment happy-dom` ドックブロックで DOM 環境に切替える。
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
