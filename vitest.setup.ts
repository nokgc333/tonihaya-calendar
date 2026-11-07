import "@testing-library/jest-dom/vitest";

if (typeof document !== "undefined" && !("startViewTransition" in document)) {
  (
    document as unknown as {
      startViewTransition: (cb: () => void) => object;
    }
  ).startViewTransition = (cb: () => void) => {
    cb();
    return {
      finished: Promise.resolve(),
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
    };
  };
}

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
