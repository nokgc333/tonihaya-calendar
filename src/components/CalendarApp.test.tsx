// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarApp } from "@/components/CalendarApp";

const group = (root: HTMLElement): HTMLElement =>
  root.querySelector('[role="group"][aria-label="表示レベルの切替"]')!;

const jump = (root: HTMLElement, label: string): void => {
  const button = [...group(root).querySelectorAll("button")].find(
    (b) => b.textContent === label,
  )!;
  act(() => {
    fireEvent.click(button);
  });
};

const press = (root: HTMLElement, label: string): void => {
  act(() => {
    fireEvent.click(root.querySelector(`[aria-label="${label}"]`)!);
  });
};

describe("CalendarApp navigation", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0));
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("jumps from the overview to a day and back with the level switcher", () => {
    const { container } = render(<CalendarApp />);
    const before = window.history.length;
    jump(container, "日");
    expect(window.location.search).toBe("?y=2026&m=7&d=15&v=day");
    expect(window.history.length).toBe(before + 1);
    jump(container, "年");
    expect(window.location.search).toBe("?y=2026");
  });

  it("steps through months with replace and keeps the level", () => {
    const { container } = render(<CalendarApp />);
    jump(container, "月");
    const before = window.history.length;
    press(container, "次の月");
    expect(window.location.search).toBe("?y=2026&m=8");
    expect(window.history.length).toBe(before);
  });

  it("returns from a day to its week and from the week to the month", () => {
    window.history.replaceState({}, "", "/?y=2026&m=3&d=10&v=day");
    const { container } = render(<CalendarApp />);
    press(container, "週に戻る（Escでも戻れます）");
    expect(window.location.search).toBe("?y=2026&m=3&d=10&v=week");
    press(container, "月に戻る（Escでも戻れます）");
    expect(window.location.search).toBe("?y=2026&m=3");
  });

  it("opens a month from the overview as a new history entry", () => {
    const { container } = render(<CalendarApp />);
    const before = window.history.length;
    act(() => {
      fireEvent.click(container.querySelectorAll('section[role="button"]')[2]);
    });
    expect(window.location.search).toBe("?y=2026&m=3");
    expect(window.history.length).toBe(before + 1);
  });

  it("restores the saved week start and stores a new one", () => {
    localStorage.setItem("tonihaya.weekStart", "mon");
    const { container } = render(<CalendarApp />);
    press(container, "設定");
    const dialog = container.querySelector("[role=dialog]")!;
    const sun = [...dialog.querySelectorAll("button")].find(
      (b) => b.textContent === "日",
    )!;
    expect(sun.getAttribute("aria-current")).toBeNull();
    act(() => {
      fireEvent.click(sun);
    });
    expect(localStorage.getItem("tonihaya.weekStart")).toBe("sun");
  });

  it("follows the browser history when it changes", () => {
    const { container } = render(<CalendarApp />);
    window.history.replaceState({}, "", "/?y=2027&m=2&d=28&v=week");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(
      container.querySelector('[aria-label="月に戻る（Escでも戻れます）"]'),
    ).not.toBeNull();
  });
});
