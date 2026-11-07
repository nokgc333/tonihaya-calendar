// @vitest-environment happy-dom
import { renderHook, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEscapeToBack } from "@/components/common/useEscapeToBack";

describe("useEscapeToBack", () => {
  it("calls back on Escape only", () => {
    const onBack = vi.fn();
    renderHook(() => useEscapeToBack(onBack));
    fireEvent.keyDown(window, { key: "a" });
    expect(onBack).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("stops listening after unmount", () => {
    const onBack = vi.fn();
    const { unmount } = renderHook(() => useEscapeToBack(onBack));
    unmount();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onBack).not.toHaveBeenCalled();
  });
});
