// @vitest-environment happy-dom
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeekNav } from "@/components/WeekNav";
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
    <WeekNav
      rangeLabel="2026年 7月12日 〜 7月18日"
      date={{ year: 2026, month: 7, day: 15 }}
      weekStart="sun"
      {...h}
    />,
  );
  return { h, view };
};

describe("WeekNav", () => {
  it("shows the range label it is given", async () => {
    await show().view;
    expect(screen.getByText("2026年 7月12日 〜 7月18日")).toBeInTheDocument();
  });

  it("goes back, and one week each way", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByLabelText("月に戻る（Escでも戻れます）"));
    fireEvent.click(screen.getByLabelText("前の週"));
    fireEvent.click(screen.getByLabelText("次の週"));
    expect(h.onBack).toHaveBeenCalledTimes(1);
    expect(h.onShift.mock.calls).toEqual([[-1], [1]]);
  });

  it("marks the week level as current and jumps to another level", async () => {
    const { h, view } = show();
    await view;
    expect(screen.getByRole("button", { name: "週" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "日" }));
    expect(h.onJump).toHaveBeenCalledWith("day");
  });

  it("passes the week start choice on", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByRole("button", { name: "設定" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "月" }),
    );
    expect(h.onWeekStartChange).toHaveBeenCalledWith("mon");
  });
});
