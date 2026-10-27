// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeekAllDayRow } from "@/components/week/WeekAllDayRow";
import { buildWeekView } from "@/domain/view";
import { makeEvent } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const days = buildWeekView({ year: 2026, month: 7, day: 15 }, null, {
  weekStart: "sun",
}).days;

describe("WeekAllDayRow", () => {
  it("has the all-day label and one cell for each of the seven days", () => {
    const { container } = render(
      <WeekAllDayRow days={days} events={[]} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("終日")).toBeInTheDocument();
    expect(container.querySelectorAll(".border-l")).toHaveLength(7);
  });

  it("shows a multi-day event in each day it covers", () => {
    render(
      <WeekAllDayRow
        days={days}
        events={[makeEvent("Trip", [2026, 7, 14], [2026, 7, 16])]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByTitle("Trip")).toHaveLength(3);
  });

  it("tells which event was picked", () => {
    const onSelect = vi.fn();
    render(
      <WeekAllDayRow
        days={days}
        events={[makeEvent("Solo", [2026, 7, 15], [2026, 7, 15])]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByTitle("Solo"));
    expect(onSelect).toHaveBeenCalledWith("Solo");
  });

  it("shows the holiday name of a day in the week", () => {
    const holidayWeek = buildWeekView({ year: 2026, month: 7, day: 20 }, null, {
      weekStart: "sun",
    }).days;
    render(<WeekAllDayRow days={holidayWeek} events={[]} onSelect={vi.fn()} />);
    expect(screen.getByText("海の日")).toBeInTheDocument();
  });
});
