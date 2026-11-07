import { describe, expect, it } from "vitest";
import { sortForDay, type CalendarEvent } from "@/domain/event";

const timed = (
  id: string,
  hour: number,
  createdAt: number,
  priority: CalendarEvent["priority"] = "normal",
): CalendarEvent => ({
  id,
  title: id,
  allDay: false,
  start: { date: { year: 2026, month: 7, day: 1 }, time: { hour, minute: 0 } },
  end: {
    date: { year: 2026, month: 7, day: 1 },
    time: { hour: hour + 1, minute: 0 },
  },
  colorKey: "blue",
  priority,
  createdAt,
  updatedAt: createdAt,
});

describe("sortForDay ties", () => {
  it("orders events that start together by priority, high first", () => {
    const sorted = sortForDay([
      timed("low", 9, 1, "low"),
      timed("high", 9, 2, "high"),
      timed("mid", 9, 3),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(["high", "mid", "low"]);
  });

  it("orders events of the same time and priority by creation time", () => {
    const sorted = sortForDay([timed("late", 9, 5), timed("early", 9, 1)]);
    expect(sorted.map((e) => e.id)).toEqual(["early", "late"]);
  });
});
