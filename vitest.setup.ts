import "@testing-library/jest-dom/vitest";

// setupFiles は node 環境の domain テストでも走るため document 参照を typeof でガードする。
// happy-dom/jsdom は View Transitions API を未実装なので、触れても落ちないよう即時実行フォールバックを置く。
if (typeof document !== "undefined" && !("startViewTransition" in document)) {
  // @ts-expect-error 実験的 API のテスト用モック
  document.startViewTransition = (cb: () => void) => {
    cb();
    return {
      finished: Promise.resolve(),
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
    };
  };
}

// useEvents の addEvent が使う crypto.randomUUID を、無い環境向けに簡易フォールバック。
if (
  typeof globalThis.crypto === "undefined" ||
  typeof globalThis.crypto.randomUUID !== "function"
) {
  const g = globalThis as unknown as { crypto: { randomUUID: () => string } };
  g.crypto = {
    ...(globalThis.crypto ?? {}),
    randomUUID: () => "test-" + Math.random().toString(16).slice(2),
  } as typeof g.crypto;
}
