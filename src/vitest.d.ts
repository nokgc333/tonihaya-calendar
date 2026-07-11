// jest-dom のマッチャ型（toBeInTheDocument / toHaveTextContent 等）を vitest の
// expect に型拡張として取り込む。ランタイム登録は vitest.setup.ts が行うが、tsc は
// src/ 配下しか見ないためここで副作用 import を置いて型を全テストに適用する。
import "@testing-library/jest-dom/vitest";
