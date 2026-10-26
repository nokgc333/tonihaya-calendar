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
      fireEvent.click(
        container.querySelector('[role="group"][aria-label="3月"]')!,
      );
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

describe("CalendarApp drill-down", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0));
    localStorage.clear();
    window.history.replaceState({}, "", "/?y=2026&m=7");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const clickDay = (root: HTMLElement, day: string): void => {
    const cell = [
      ...root.querySelectorAll<HTMLElement>("[class*='cursor-pointer']"),
    ].find((e) => e.textContent?.split(" ")[0] === day)!;
    act(() => {
      fireEvent.click(cell);
    });
  };

  it("opens the week of a clicked day as a new history entry and returns to the month", () => {
    const { container } = render(<CalendarApp />);
    const before = window.history.length;
    clickDay(container, "15");
    expect(window.location.search).toBe("?y=2026&m=7&d=15&v=week");
    expect(window.history.length).toBe(before + 1);
    press(container, "月に戻る（Escでも戻れます）");
    expect(window.location.search).toBe("?y=2026&m=7");
  });

  it("returns to the month the week was opened from, even for a day of another month", () => {
    window.history.replaceState({}, "", "/?y=2026&m=8");
    const { container } = render(<CalendarApp />);
    clickDay(container, "31");
    press(container, "月に戻る（Escでも戻れます）");
    expect(window.location.search).toBe("?y=2026&m=8");
  });

  it("changes the week in place and opens a day of it as a new history entry", () => {
    window.history.replaceState({}, "", "/?y=2026&m=7&d=15&v=week");
    const { container } = render(<CalendarApp />);
    const before = window.history.length;
    press(container, "次の週");
    expect(window.location.search).toBe("?y=2026&m=7&d=22&v=week");
    expect(window.history.length).toBe(before);
    press(container, "木23 7月23日を開く");
    expect(window.location.search).toBe("?y=2026&m=7&d=23&v=day");
    expect(window.history.length).toBe(before + 1);
  });

  it("steps a day in place and goes back to the week of that day", () => {
    window.history.replaceState({}, "", "/?y=2026&m=7&d=31&v=day");
    const { container } = render(<CalendarApp />);
    const before = window.history.length;
    press(container, "次の日");
    expect(window.location.search).toBe("?y=2026&m=8&d=1&v=day");
    expect(window.history.length).toBe(before);
    press(container, "週に戻る（Escでも戻れます）");
    expect(window.location.search).toBe("?y=2026&m=8&d=1&v=week");
  });

  it("changes the overview year in place", () => {
    window.history.replaceState({}, "", "/?y=2026");
    const { container } = render(<CalendarApp />);
    const before = window.history.length;
    act(() => {
      fireEvent.click(
        [...container.querySelectorAll("button")].find(
          (b) => b.textContent === "1 ›",
        )!,
      );
    });
    expect(window.location.search).toBe("?y=2027");
    expect(window.history.length).toBe(before);
  });

  it("keeps the year inside the supported range when stepping days", () => {
    window.history.replaceState({}, "", "/?y=2150&m=12&d=31&v=day");
    const { container } = render(<CalendarApp />);
    press(container, "次の日");
    expect(window.location.search).toBe("?y=2150&m=1&d=1&v=day");
  });
});

describe("CalendarApp announcements", () => {
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

  const status = (root: HTMLElement) =>
    root.querySelector("[role='status']")!.textContent?.trim();

  it("says nothing when the page first shows", () => {
    const { container } = render(<CalendarApp />);
    expect(status(container)).toBe("");
  });

  it("says nothing when the page opens on a deep link", () => {
    window.history.replaceState({}, "", "/?y=2026&m=3&d=10&v=day");
    const { container } = render(<CalendarApp />);
    expect(status(container)).toBe("");
  });

  it("says which view it moved to", () => {
    const { container } = render(<CalendarApp />);
    jump(container, "月");
    expect(status(container)).toBe("2026年7月を表示しています");
    jump(container, "日");
    expect(status(container)).toBe("2026年7月15日 水曜日を表示しています");
    jump(container, "週");
    expect(status(container)).toBe("2026年7月15日の週を表示しています");
    jump(container, "年");
    expect(status(container)).toBe("2026年の一覧を表示しています");
  });

  it("says which month it moved to when it steps through the months", () => {
    window.history.replaceState({}, "", "/?y=2026&m=7");
    const { container } = render(<CalendarApp />);
    press(container, "次の月");
    expect(status(container)).toBe("2026年8月を表示しています");
  });
});
