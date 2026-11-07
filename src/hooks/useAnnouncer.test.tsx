// @vitest-environment happy-dom
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { AnnouncerProvider, useAnnouncer } from "@/hooks/useAnnouncer";

afterEach(cleanup);

const wrapper = ({ children }: { children: ReactNode }) => (
  <AnnouncerProvider>{children}</AnnouncerProvider>
);

describe("AnnouncerProvider", () => {
  it("has a polite status region that is empty at first", () => {
    render(<AnnouncerProvider>x</AnnouncerProvider>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region.textContent).toBe("");
  });

  it("keeps the region out of sight", () => {
    render(<AnnouncerProvider>x</AnnouncerProvider>);
    expect(screen.getByRole("status").className).toContain("sr-only");
  });

  it("shows the message that is announced", () => {
    const { result } = renderHook(() => useAnnouncer(), { wrapper });
    act(() => result.current("予定を保存しました"));
    expect(screen.getByRole("status").textContent?.trim()).toBe(
      "予定を保存しました",
    );
  });

  it("changes the text when the same message is announced twice, so that it is read again", () => {
    const { result } = renderHook(() => useAnnouncer(), { wrapper });
    act(() => result.current("保存しました"));
    const first = screen.getByRole("status").textContent;
    act(() => result.current("保存しました"));
    expect(screen.getByRole("status").textContent).not.toBe(first);
    expect(screen.getByRole("status").textContent?.trim()).toBe("保存しました");
  });

  it("changes the text every time the same message is announced again", () => {
    const { result } = renderHook(() => useAnnouncer(), { wrapper });
    const texts: (string | null)[] = [];
    for (let i = 0; i < 4; i += 1) {
      act(() => result.current("保存しました"));
      texts.push(screen.getByRole("status").textContent);
    }
    for (let i = 1; i < texts.length; i += 1) {
      expect(texts[i]).not.toBe(texts[i - 1]);
    }
  });

  it("replaces the previous message with the next one", () => {
    const { result } = renderHook(() => useAnnouncer(), { wrapper });
    act(() => result.current("a"));
    act(() => result.current("b"));
    expect(screen.getByRole("status").textContent?.trim()).toBe("b");
  });
});

describe("useAnnouncer outside the provider", () => {
  it("does nothing instead of failing", () => {
    const { result } = renderHook(() => useAnnouncer());
    expect(() => act(() => result.current("x"))).not.toThrow();
  });
});
