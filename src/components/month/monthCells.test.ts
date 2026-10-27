import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/domain/event";
import { buildMonthView } from "@/domain/view";
import { cellContext, isPivotWeek, resolveCellMonth } from "./monthCells";

const month = (year: number, m: number) => buildMonthView(year, m, null, "sun");

const event = (id: string, day: number, createdAt: number): CalendarEvent => ({
  id,
  title: id,
  allDay: true,
  start: { date: { year: 2026, month: 7, day } },
  end: { date: { year: 2026, month: 7, day } },
  colorKey: "blue",
  priority: "normal",
  createdAt,
  updatedAt: createdAt,
});

describe("resolveCellMonth", () => {
  const july = month(2026, 7).weeks.flat();

  it("keeps the month for a day inside the month", () => {
    const index = july.findIndex((c) => c.inMonth);

    expect(resolveCellMonth(july, index, 2026, 7)).toEqual({
      year: 2026,
      month: 7,
    });
  });

  it("puts the leading days of a grid in the previous month", () => {
    expect(resolveCellMonth(july, 0, 2026, 7)).toEqual({
      year: 2026,
      month: 6,
    });
  });

  it("puts the trailing days of a grid in the next month", () => {
    expect(resolveCellMonth(july, july.length - 1, 2026, 7)).toEqual({
      year: 2026,
      month: 8,
    });
  });

  it("goes back to December of the previous year from January", () => {
    const january = month(2026, 1).weeks.flat();

    expect(resolveCellMonth(january, 0, 2026, 1)).toEqual({
      year: 2025,
      month: 12,
    });
  });

  it("goes on to January of the next year from December", () => {
    const december = month(2026, 12).weeks.flat();

    expect(resolveCellMonth(december, december.length - 1, 2026, 12)).toEqual({
      year: 2027,
      month: 1,
    });
  });
});

describe("isPivotWeek", () => {
  const view = month(2026, 7);
  const flat = view.weeks.flat();
  const grid = {
    flat,
    year: 2026,
    month: 7,
    jumpDay: null,
    events: undefined,
  };

  it("is true for the week that holds the pivot day", () => {
    const pivot = { year: 2026, month: 7, day: 15 };
    const flags = view.weeks.map((week, wi) =>
      isPivotWeek(grid, week, wi, pivot),
    );

    expect(flags.filter(Boolean)).toHaveLength(1);
    expect(view.weeks[flags.indexOf(true)].some((c) => c.day === 15)).toBe(
      true,
    );
  });

  it("finds a pivot day that is shown as a day of the neighbouring month", () => {
    const pivot = { year: 2026, month: 6, day: 28 };

    expect(isPivotWeek(grid, view.weeks[0], 0, pivot)).toBe(true);
  });

  it("is false without a year or without a pivot day", () => {
    const pivot = { year: 2026, month: 7, day: 15 };

    expect(
      isPivotWeek({ ...grid, year: undefined }, view.weeks[2], 2, pivot),
    ).toBe(false);
    expect(isPivotWeek(grid, view.weeks[2], 2, null)).toBe(false);
    expect(isPivotWeek(grid, view.weeks[2], 2, undefined)).toBe(false);
  });
});

describe("cellContext", () => {
  const view = month(2026, 7);
  const flat = view.weeks.flat();
  const index = flat.findIndex((c) => c.inMonth && c.day === 15);
  const cell = flat[index];
  const base = { flat, year: 2026, month: 7, jumpDay: null, events: undefined };

  it("knows which month the cell belongs to only when the year is given", () => {
    expect(cellContext(base, cell, index, true).resolved).toEqual({
      year: 2026,
      month: 7,
    });
    expect(
      cellContext({ ...base, year: undefined }, cell, index, true).resolved,
    ).toBeUndefined();
  });

  it("marks the jump day, but not on the cell that only follows it", () => {
    const jumpDay = { year: 2026, month: 7, day: 15 };

    expect(cellContext({ ...base, jumpDay }, cell, index, true).isJump).toBe(
      true,
    );
    expect(cellContext({ ...base, jumpDay }, cell, index, false).isJump).toBe(
      false,
    );
  });

  it("does not mark the jump day on a day of another month with the same number", () => {
    const outside = flat.findIndex((c) => !c.inMonth && c.day === 28);
    const jumpDay = { year: 2026, month: 7, day: 28 };

    expect(
      cellContext({ ...base, jumpDay }, flat[outside], outside, true).isJump,
    ).toBe(false);
  });

  it("lists the events of the day, sorted, and none for the following copy", () => {
    const events = [
      event("late", 15, 2),
      event("early", 15, 1),
      event("x", 3, 1),
    ];
    const withEvents = { ...base, events };

    expect(
      cellContext(withEvents, cell, index, true).dayEvents?.map((e) => e.id),
    ).toEqual(["early", "late"]);
    expect(
      cellContext(withEvents, cell, index, false).dayEvents,
    ).toBeUndefined();
  });

  it("lists no events for a day outside the month", () => {
    const events = [event("x", 28, 1)];
    const outside = flat.findIndex((c) => !c.inMonth);

    expect(
      cellContext({ ...base, events }, flat[outside], outside, true).dayEvents,
    ).toBeUndefined();
  });
});
