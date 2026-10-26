// @vitest-environment happy-dom
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DayNav } from "@/components/DayNav";
import { renderInApp } from "../../tests/support/calendarHarness";

afterEach(cleanup);

const show = () => {
  const h = {
    onBack: vi.fn(),
    onShift: vi.fn(),
    onJump: vi.fn(),
    onWeekStartChange: vi.fn(),
  };
  const view = renderInApp(
    <DayNav
      date={{ year: 2026, month: 7, day: 15 }}
      weekday={3}
      weekStart="sun"
      {...h}
    />,
  );
  return { h, view };
};

describe("DayNav", () => {
  it("shows the date with its weekday", async () => {
    await show().view;
    expect(screen.getByText("2026年 7月15日 水曜日")).toBeInTheDocument();
  });

  it("goes back, and one day each way", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByLabelText("週に戻る（Escでも戻れます）"));
    fireEvent.click(screen.getByLabelText("前の日"));
    fireEvent.click(screen.getByLabelText("次の日"));
    expect(h.onBack).toHaveBeenCalledTimes(1);
    expect(h.onShift.mock.calls).toEqual([[-1], [1]]);
  });

  it("marks the day level as current in the level switcher and jumps from it", async () => {
    const { h, view } = show();
    await view;
    expect(screen.getByRole("button", { name: "日" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "週" }));
    expect(h.onJump).toHaveBeenCalledWith("week");
  });

  it("offers adding an event on the shown date", async () => {
    await show().view;
    fireEvent.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(screen.getByLabelText("開始日")).toHaveValue("2026-07-15");
  });
});
