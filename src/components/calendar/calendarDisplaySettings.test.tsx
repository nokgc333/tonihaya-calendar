// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarApp } from "@/components/calendar/CalendarApp";

describe("the display settings in the calendar", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 1, 17, 12, 0));
    window.history.replaceState({}, "", "/?y=2026&m=2");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("hides the rokuyo of the month from the settings, and keeps it hidden after a reload", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const first = render(<CalendarApp />);
    expect(screen.getAllByText("先勝").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "設定" }));
    const group = screen.getByRole("group", { name: "六曜" });
    await user.click(group.querySelector("button:last-child")!);
    expect(screen.queryByText("先勝")).toBeNull();
    expect(localStorage.getItem("tonihaya.rokuyo")).toBe("off");
    first.unmount();
    render(<CalendarApp />);
    await act(async () => undefined);
    expect(screen.queryByText("先勝")).toBeNull();
  });

  it("hides the Japanese month name of the month from the settings", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CalendarApp />);
    expect(screen.getAllByText(/如月/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "設定" }));
    const group = screen.getByRole("group", { name: "和風月名" });
    await user.click(group.querySelector("button:last-child")!);
    expect(screen.queryByText(/如月/)).toBeNull();
  });

  it.each(["week", "day"])(
    "leaves the rokuyo out of the %s when it is turned off",
    async (view) => {
      localStorage.setItem("tonihaya.rokuyo", "off");
      window.history.replaceState({}, "", `/?y=2026&m=2&d=17&v=${view}`);
      render(<CalendarApp />);
      await act(async () => undefined);
      expect(screen.queryByText("先勝")).toBeNull();
      expect(
        screen.queryByLabelText(/先勝/, { selector: "button" }),
      ).toBeNull();
    },
  );
});
