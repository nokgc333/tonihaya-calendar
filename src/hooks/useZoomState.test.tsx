// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useZoomState } from "@/hooks/useZoomState";

const setMotion = (reduce: boolean) =>
  vi.stubGlobal("matchMedia", () => ({ matches: reduce }));

describe("useZoomState", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0));
    window.history.replaceState({}, "", "/");
    setMotion(false);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "startViewTransition");
  });

  it("reads today and the zoom from the address after mounting", () => {
    window.history.replaceState({}, "", "/?y=2027&m=3");
    const { result } = renderHook(() => useZoomState());
    expect(result.current.today).toEqual({ year: 2026, month: 7, day: 15 });
    expect(result.current.zoom).toEqual({
      level: "month",
      year: 2027,
      month: 3,
    });
  });

  it("pushes, replaces or leaves the history by the mode", () => {
    const { result } = renderHook(() => useZoomState());
    const before = window.history.length;
    act(() =>
      result.current.navigate({ level: "month", year: 2026, month: 2 }, "push"),
    );
    expect(window.location.search).toBe("?y=2026&m=2");
    expect(window.history.length).toBe(before + 1);
    act(() =>
      result.current.navigate(
        { level: "month", year: 2026, month: 3 },
        "replace",
      ),
    );
    expect(window.location.search).toBe("?y=2026&m=3");
    expect(window.history.length).toBe(before + 1);
    act(() =>
      result.current.navigate({ level: "month", year: 2026, month: 4 }, "none"),
    );
    expect(window.location.search).toBe("?y=2026&m=3");
    expect(result.current.zoom).toEqual({
      level: "month",
      year: 2026,
      month: 4,
    });
  });

  it("changes the state inside a view transition when the browser supports it", () => {
    const start = vi.fn((cb: () => void) => cb());
    Object.defineProperty(document, "startViewTransition", {
      value: start,
      configurable: true,
    });
    const { result } = renderHook(() => useZoomState());
    act(() =>
      result.current.navigate({ level: "overview", year: 2030 }, "replace"),
    );
    expect(start).toHaveBeenCalledTimes(1);
    expect(result.current.zoom.year).toBe(2030);
  });

  it("skips the view transition when the user prefers reduced motion", () => {
    setMotion(true);
    const start = vi.fn((cb: () => void) => cb());
    Object.defineProperty(document, "startViewTransition", {
      value: start,
      configurable: true,
    });
    const { result } = renderHook(() => useZoomState());
    act(() =>
      result.current.navigate({ level: "overview", year: 2030 }, "replace"),
    );
    expect(start).not.toHaveBeenCalled();
    expect(result.current.zoom.year).toBe(2030);
  });
});
