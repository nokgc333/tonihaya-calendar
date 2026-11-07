// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DayCellView } from "@/components/month/DayCellView";
import { buildMonthView, type DayCell } from "@/domain/view";
import { makeEvent } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const cells = buildMonthView(
  2026,
  7,
  { year: 2026, month: 7, day: 15 },
  "sun",
).weeks.flat();
const cellOf = (day: number, inMonth = true): DayCell =>
  cells.find((c) => c.day === day && c.inMonth === inMonth)!;

const many = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    makeEvent(`e${i}`, [2026, 7, 15], [2026, 7, 15]),
  );

const show = (
  cell: DayCell,
  over: Partial<Parameters<typeof DayCellView>[0]> = {},
) =>
  render(
    <DayCellView
      cell={cell}
      size="sm"
      spacious={false}
      jump={false}
      {...over}
    />,
  );

describe("DayCellView", () => {
  it("shows the day number and marks today", () => {
    const { container } = show(cellOf(15));
    expect(container.textContent).toBe("15");
    expect(container.querySelector("[aria-current='date']")).not.toBeNull();
  });

  it("does not mark an ordinary day as today", () => {
    const { container } = show(cellOf(16));
    expect(container.querySelector("[aria-current]")).toBeNull();
  });

  it("draws a disc and a title for a holiday", () => {
    const { container } = show(cellOf(20));
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
    expect(container.firstElementChild!.getAttribute("title")).toBe("海の日");
  });

  it("shows a day of the neighboring month in the faint text color, not through opacity, and keeps its events out", () => {
    const outside = cells.find((c) => !c.inMonth)!;
    const { container } = show(outside, { dayEvents: many(2) });
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe("");
    expect(
      (container.querySelector("span.relative span.relative") as HTMLElement)
        .style.color,
    ).toBe("var(--text-faint)");
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
  });

  it("shows a day of the month in its own color, never in the faint one", () => {
    const { container } = show(cellOf(16));
    expect(
      (container.querySelector("span.relative span.relative") as HTMLElement)
        .style.color,
    ).not.toBe("var(--text-faint)");
  });

  it("names the jump transition only when it is the jump target", () => {
    expect(
      (
        show(cellOf(15), { jump: true }).container
          .firstElementChild as HTMLElement
      ).style.viewTransitionName,
    ).toBe("jump-zoom");
    cleanup();
    expect(
      (show(cellOf(15)).container.firstElementChild as HTMLElement).style
        .viewTransitionName,
    ).toBe("");
  });

  it("has no button for the day without a click handler, a year and a month", () => {
    expect(
      show(cellOf(15), { onDayClick: vi.fn() }).container.querySelector(
        "button",
      ),
    ).toBeNull();
    cleanup();
    expect(
      show(cellOf(15), {
        cellYear: 2026,
        cellMonth: 7,
      }).container.querySelector("button"),
    ).toBeNull();
  });

  it("has one button, named after the date, that is the only tab stop of the cell", () => {
    const { container } = show(cellOf(15), {
      onDayClick: vi.fn(),
      cellYear: 2026,
      cellMonth: 7,
    });
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "7月15日を開く" }),
    ).toBeInTheDocument();
    expect(container.querySelector("[role='button'], [tabindex]")).toBeNull();
  });
});
