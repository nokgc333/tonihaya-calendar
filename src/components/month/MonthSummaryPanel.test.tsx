// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MonthSummaryPanel } from "@/components/month/MonthSummaryPanel";
import { buildMonthDetail } from "@/domain/view";

afterEach(cleanup);

const panel = (
  month: number,
  today: { year: number; month: number; day: number } | null = null,
) =>
  render(
    <MonthSummaryPanel
      detail={buildMonthDetail(2026, month, today, { weekStart: "sun" })}
    />,
  );

describe("MonthSummaryPanel", () => {
  it("shows the month names in Japanese, English and the traditional name", () => {
    const { container } = panel(7);
    expect(container.textContent).toContain("7月");
    expect(container.textContent).toContain("July");
  });

  it("shows the four counts of the month", () => {
    const { container } = panel(7);
    const text = container.textContent!;
    expect(text).toContain("祝日1日");
    expect(text).toContain("総日数31日");
    expect(text).toContain("営業日22日");
  });

  it("counts the business days that remain from today, not all of the month", () => {
    const { container } = panel(7, { year: 2026, month: 7, day: 15 });
    expect(container.textContent).toContain("営業日22日");
    expect(container.textContent).toContain("営業日残12日");
  });

  it("lists the holidays with their date and weekday", () => {
    panel(7);
    expect(screen.getByText("海の日")).toBeInTheDocument();
    expect(screen.getByText("7/20")).toBeInTheDocument();
    expect(screen.getByText("(月)")).toBeInTheDocument();
  });

  it("says there is no holiday in a month without one", () => {
    panel(6);
    expect(screen.getByText("祝日なし")).toBeInTheDocument();
  });

  it("lists every holiday of a month with several", () => {
    const { container } = panel(5);
    expect(
      [...container.querySelectorAll("li")].map((li) => li.textContent),
    ).toEqual([
      "5/3(日)憲法記念日",
      "5/4(月)みどりの日",
      "5/5(火)こどもの日",
      "5/6(水)振替休日",
    ]);
  });
});
