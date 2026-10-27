// @vitest-environment happy-dom
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OverviewNav } from "@/components/year/OverviewNav";
import { renderInApp } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const today = { year: 2026, month: 7, day: 15 };

const show = (year: number, t: typeof today | null = today) => {
  const h = {
    onYearChange: vi.fn(),
    onLayoutChange: vi.fn(),
    onJump: vi.fn(),
    onWeekStartChange: vi.fn(),
  };
  const view = renderInApp(
    <OverviewNav year={year} today={t} layout="3x4" weekStart="sun" {...h} />,
  );
  return { h, view };
};

describe("OverviewNav", () => {
  it("passes year changes on", async () => {
    const { h, view } = show(2026);
    await view;
    fireEvent.click(screen.getByRole("button", { name: "1 ›" }));
    expect(h.onYearChange).toHaveBeenCalledWith(2027);
  });

  it("passes layout changes on", async () => {
    const { h, view } = show(2026);
    await view;
    fireEvent.click(screen.getByRole("button", { name: "4×3" }));
    expect(h.onLayoutChange).toHaveBeenCalledWith("4x3");
  });

  it("marks the year level as current and jumps to another level", async () => {
    const { h, view } = show(2026);
    await view;
    expect(screen.getByRole("button", { name: "年" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "月" }));
    expect(h.onJump).toHaveBeenCalledWith("month");
  });

  it("adds an event on today in the current year", async () => {
    await show(2026).view;
    fireEvent.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(screen.getByLabelText("開始日")).toHaveValue("2026-07-15");
  });

  it("adds an event on January 1 in another year", async () => {
    await show(2030).view;
    fireEvent.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(screen.getByLabelText("開始日")).toHaveValue("2030-01-01");
  });

  it("adds an event on January 1 until today is known", async () => {
    await show(2026, null).view;
    fireEvent.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(screen.getByLabelText("開始日")).toHaveValue("2026-01-01");
  });
});
