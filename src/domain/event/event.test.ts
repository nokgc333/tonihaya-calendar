import { describe, expect, it } from "vitest";
import {
  clipEventToDay,
  eventsForDay,
  minutesOfDay,
  layoutDayColumns,
  type DaySegment,
} from "./event";
import type { CalendarEvent } from "./types";

const base = {
  colorKey: "blue",
  priority: "normal",
  createdAt: 0,
  updatedAt: 0,
} as const;
const allDay = (
  id: string,
  s: [number, number, number],
  e: [number, number, number],
): CalendarEvent => ({
  ...base,
  id,
  title: id,
  allDay: true,
  start: { date: { year: s[0], month: s[1], day: s[2] } },
  end: { date: { year: e[0], month: e[1], day: e[2] } },
});

describe("minutesOfDay", () => {
  it("converts a time to minutes within the day", () => {
    expect(minutesOfDay({ hour: 9, minute: 30 })).toBe(570);
  });
});

describe("eventsForDay", () => {
  it("returns events whose range includes the day (including the middle days of a multi-day event)", () => {
    const trip = allDay("trip", [2026, 7, 10], [2026, 7, 15]);
    const other = allDay("x", [2026, 7, 20], [2026, 7, 20]);
    const got = eventsForDay([trip, other], { year: 2026, month: 7, day: 12 });
    expect(got.map((e) => e.id)).toEqual(["trip"]);
  });
});

describe("clipEventToDay", () => {
  const multi: CalendarEvent = {
    ...base,
    id: "m",
    title: "m",
    allDay: false,
    start: {
      date: { year: 2026, month: 7, day: 10 },
      time: { hour: 23, minute: 0 },
    },
    end: {
      date: { year: 2026, month: 7, day: 12 },
      time: { hour: 2, minute: 0 },
    },
  };
  it("the first day runs from the start time to 24:00 and continues to the next day", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 10 })!;
    expect([
      s.startMin,
      s.endMin,
      s.continuesFromPrev,
      s.continuesToNext,
    ]).toEqual([1380, 1440, false, true]);
  });
  it("a middle day runs from 0:00 to 24:00 and continues in both directions", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 11 })!;
    expect([
      s.startMin,
      s.endMin,
      s.continuesFromPrev,
      s.continuesToNext,
    ]).toEqual([0, 1440, true, true]);
  });
  it("the last day runs from 0:00 to the end time and continues from the previous day", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 12 })!;
    expect([
      s.startMin,
      s.endMin,
      s.continuesFromPrev,
      s.continuesToNext,
    ]).toEqual([0, 120, true, false]);
  });
  it("an all-day event returns null", () => {
    expect(
      clipEventToDay(allDay("a", [2026, 7, 12], [2026, 7, 12]), {
        year: 2026,
        month: 7,
        day: 12,
      }),
    ).toBeNull();
  });
  it("a day outside the range returns null", () => {
    expect(clipEventToDay(multi, { year: 2026, month: 7, day: 13 })).toBeNull();
  });
});

describe("layoutDayColumns", () => {
  const seg = (id: string, startMin: number, endMin: number): DaySegment => ({
    event: {
      ...base,
      id,
      title: id,
      allDay: false,
      start: {
        date: { year: 2026, month: 7, day: 12 },
        time: { hour: 0, minute: 0 },
      },
      end: {
        date: { year: 2026, month: 7, day: 12 },
        time: { hour: 1, minute: 0 },
      },
    },
    startMin,
    endMin,
    continuesFromPrev: false,
    continuesToNext: false,
  });
  it("non-overlapping events use 1 column", () => {
    const out = layoutDayColumns([seg("a", 0, 60), seg("b", 120, 180)]);
    expect(out.every((s) => s.columnCount === 1 && s.columnIndex === 0)).toBe(
      true,
    );
  });
  it("two overlapping events are assigned 2 columns", () => {
    const out = layoutDayColumns([seg("a", 0, 120), seg("b", 60, 180)]);
    const a = out.find((s) => s.event.id === "a")!;
    const b = out.find((s) => s.event.id === "b")!;
    expect(a.columnCount).toBe(2);
    expect(b.columnCount).toBe(2);
    expect(new Set([a.columnIndex, b.columnIndex])).toEqual(new Set([0, 1]));
  });
  it("non-overlapping events are not put in the same cluster (1 column)", () => {
    const out = layoutDayColumns([
      seg("a", 0, 60),
      seg("b", 30, 90),
      seg("c", 200, 260),
    ]);
    expect(out.find((s) => s.event.id === "c")!.columnCount).toBe(1);
    expect(out.find((s) => s.event.id === "a")!.columnCount).toBe(2);
  });
});
