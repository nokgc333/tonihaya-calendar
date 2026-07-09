import { describe, expect, it } from "vitest";
import { eventsForDay, minutesOfDay, sortForDay } from "./event";
import type { CalendarEvent } from "./types";

const base = { colorKey: "blue", priority: "normal", createdAt: 0, updatedAt: 0 } as const;
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
const timed = (
  id: string,
  d: [number, number, number],
  sh: number,
  eh: number,
): CalendarEvent => ({
  ...base,
  id,
  title: id,
  allDay: false,
  start: { date: { year: d[0], month: d[1], day: d[2] }, time: { hour: sh, minute: 0 } },
  end: { date: { year: d[0], month: d[1], day: d[2] }, time: { hour: eh, minute: 0 } },
});

describe("minutesOfDay", () => {
  it("時刻を当日分に換算する", () => {
    expect(minutesOfDay({ hour: 9, minute: 30 })).toBe(570);
  });
});

describe("eventsForDay", () => {
  it("範囲に該当日を含むイベントを返す（複数日の中日も含む）", () => {
    const trip = allDay("trip", [2026, 7, 10], [2026, 7, 15]);
    const other = allDay("x", [2026, 7, 20], [2026, 7, 20]);
    const got = eventsForDay([trip, other], { year: 2026, month: 7, day: 12 });
    expect(got.map((e) => e.id)).toEqual(["trip"]);
  });
});

describe("sortForDay", () => {
  it("終日→時間、時間は開始時刻昇順", () => {
    const t9 = timed("t9", [2026, 7, 12], 9, 10);
    const t8 = timed("t8", [2026, 7, 12], 8, 9);
    const a = allDay("a", [2026, 7, 12], [2026, 7, 12]);
    expect(sortForDay([t9, a, t8]).map((e) => e.id)).toEqual(["a", "t8", "t9"]);
  });
});
