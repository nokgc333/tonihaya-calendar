// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AllDayCell, AllDayLabel } from "@/components/timeline/AllDayCell";
import { buildDayView } from "@/domain/view";
import { makeEvent } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const day = (d: number) => buildDayView(2026, 7, d, null).day;
const events = [
  makeEvent("Trip", [2026, 7, 14], [2026, 7, 16]),
  makeEvent("Timed", [2026, 7, 15, 9], [2026, 7, 15, 10]),
  makeEvent("Other", [2026, 7, 21], [2026, 7, 21], { colorKey: "rose" }),
];

describe("AllDayCell", () => {
  it("shows the all-day events that cover the day", () => {
    render(<AllDayCell day={day(15)} events={events} onSelect={vi.fn()} />);
    expect(screen.getByTitle("Trip")).toBeInTheDocument();
  });

  it("leaves out timed events and events of other days", () => {
    render(<AllDayCell day={day(15)} events={events} onSelect={vi.fn()} />);
    expect(screen.queryByTitle("Timed")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Other")).not.toBeInTheDocument();
  });

  it("tells which event was picked", () => {
    const onSelect = vi.fn();
    render(<AllDayCell day={day(15)} events={events} onSelect={onSelect} />);
    fireEvent.click(screen.getByTitle("Trip"));
    expect(onSelect).toHaveBeenCalledWith("Trip");
  });

  it("shows the name of a holiday above the events", () => {
    render(<AllDayCell day={day(20)} events={[]} onSelect={vi.fn()} />);
    expect(screen.getByText("海の日")).toBeInTheDocument();
  });

  it("shows no holiday name on an ordinary day", () => {
    const { container } = render(
      <AllDayCell day={day(15)} events={[]} onSelect={vi.fn()} />,
    );
    expect(container.textContent).toBe("");
  });

  it.each([
    [19, "var(--sun-bg)"],
    [18, "var(--sat-bg)"],
    [15, "var(--surface)"],
  ])("tints the cell for July %i by the kind of day", (d, color) => {
    const { container } = render(
      <AllDayCell day={day(d)} events={[]} onSelect={vi.fn()} />,
    );
    expect((container.firstElementChild as HTMLElement).style.background).toBe(
      color,
    );
  });
});

describe("AllDayLabel", () => {
  it("says all day", () => {
    render(<AllDayLabel />);
    expect(screen.getByText("終日")).toBeInTheDocument();
  });
});
