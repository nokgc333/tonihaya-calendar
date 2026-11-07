// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  readSavedTheme,
  saveTheme,
  THEME_STORAGE_KEY,
} from "@/components/common/theme";

const throwing = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("full");
  },
} as unknown as Storage;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("the saved theme", () => {
  it.each(["system", "light", "dark"] as const)("reads %s", (choice) => {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
    expect(readSavedTheme(localStorage)).toBe(choice);
  });

  it("is null when nothing, an unknown value or a blocked storage is read", () => {
    expect(readSavedTheme(localStorage)).toBeNull();
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    expect(readSavedTheme(localStorage)).toBeNull();
    expect(readSavedTheme(throwing)).toBeNull();
  });

  it("is saved under the theme key, and a full storage does not throw", () => {
    saveTheme(localStorage, "dark");
    expect(localStorage.getItem("tonihaya.theme")).toBe("dark");
    expect(() => saveTheme(throwing, "dark")).not.toThrow();
  });
});

describe("applyTheme", () => {
  it("sets the theme on the root, and removes it for the system setting", () => {
    const root = document.documentElement;
    applyTheme(root, "dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
    applyTheme(root, "light");
    expect(root.getAttribute("data-theme")).toBe("light");
    applyTheme(root, "system");
    expect(root.hasAttribute("data-theme")).toBe(false);
  });
});

describe("the script that applies the theme before the first paint", () => {
  const source = readFileSync("public/theme-init.js", "utf-8");
  const run = (): void => new Function(source)();

  it.each(["light", "dark"])("applies a saved %s theme", (choice) => {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
    run();
    expect(document.documentElement.getAttribute("data-theme")).toBe(choice);
  });

  it.each([null, "system", "sepia"])(
    "leaves the system setting alone for %s",
    (value) => {
      if (value !== null) localStorage.setItem(THEME_STORAGE_KEY, value);
      run();
      expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    },
  );

  it("does not throw when the storage is blocked", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { get: () => throwing });
    try {
      expect(run).not.toThrow();
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });
});
