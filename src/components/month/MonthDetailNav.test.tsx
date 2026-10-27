// @vitest-environment happy-dom
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthDetailNav } from "@/components/month/MonthDetailNav";
import { renderInApp } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const show = () => {
  const h = {
    onBack: vi.fn(),
    onShift: vi.fn(),
    onJump: vi.fn(),
    onWeekStartChange: vi.fn(),
  };
  const view = renderInApp(
    <MonthDetailNav
      year={2026}
      month={7}
      addDate={{ year: 2026, month: 7, day: 1 }}
      weekStart="sun"
      {...h}
    />,
  );
  return { h, view };
};

describe("MonthDetailNav", () => {
  it("shows the year and month", async () => {
    await show().view;
    expect(screen.getByText("2026年 7月")).toBeInTheDocument();
  });

  it("goes back, and one month each way", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByLabelText("俯瞰に戻る（Escでも戻れます）"));
    fireEvent.click(screen.getByLabelText("前の月"));
    fireEvent.click(screen.getByLabelText("次の月"));
    expect(h.onBack).toHaveBeenCalledTimes(1);
    expect(h.onShift.mock.calls).toEqual([[-1], [1]]);
  });

  it("marks the month level as current and jumps to another level", async () => {
    const { h, view } = show();
    await view;
    expect(screen.getByRole("button", { name: "月" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "年" }));
    expect(h.onJump).toHaveBeenCalledWith("overview");
  });

  it("offers adding an event on the date it was given", async () => {
    await show().view;
    fireEvent.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(screen.getByLabelText("開始日")).toHaveValue("2026-07-01");
  });
});
