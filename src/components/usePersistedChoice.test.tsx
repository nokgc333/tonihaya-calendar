// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePersistedChoice } from "@/components/usePersistedChoice";

const KEY = "test.choice";
const OPTIONS = ["a", "b"] as const;

describe("usePersistedChoice", () => {
  beforeEach(() => localStorage.clear());

  it("starts with the initial value when nothing is stored", () => {
    const { result } = renderHook(() => usePersistedChoice(KEY, "a", OPTIONS));
    expect(result.current[0]).toBe("a");
  });

  it("restores a stored value that is allowed", () => {
    localStorage.setItem(KEY, "b");
    const { result } = renderHook(() => usePersistedChoice(KEY, "a", OPTIONS));
    expect(result.current[0]).toBe("b");
  });

  it("ignores a stored value that is not allowed", () => {
    localStorage.setItem(KEY, "zzz");
    const { result } = renderHook(() => usePersistedChoice(KEY, "a", OPTIONS));
    expect(result.current[0]).toBe("a");
  });

  it("stores the new value when it changes", () => {
    const { result } = renderHook(() => usePersistedChoice(KEY, "a", OPTIONS));
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");
    expect(localStorage.getItem(KEY)).toBe("b");
  });
});
