import { describe, it, expect } from "vitest";
import { buildWeekView } from "@/domain/view";
import {
  HOUR_HEIGHT,
  initialScrollTop,
  isSameDay,
  nowLineOffset,
  weekRangeLabel,
} from "@/components/weekLayout";

const week = (year: number, month: number, day: number) =>
  buildWeekView({ year, month, day }, null, { weekStart: "sun" }).days;

describe("weekRangeLabel", () => {
  it("omits the year on the end date inside one year", () => {
    const days = week(2026, 7, 15);
    expect(weekRangeLabel(days[0], days[6])).toBe("2026年 7月12日 〜 7月18日");
  });

  it("repeats the year on the end date when the week crosses years", () => {
    const days = week(2026, 12, 31);
    expect(weekRangeLabel(days[0], days[6])).toBe(
      "2026年 12月27日 〜 2027年 1月2日",
    );
  });
});

describe("isSameDay", () => {
  const day = week(2026, 7, 15)[3];

  it("is false without a target", () => {
    expect(isSameDay(null, day)).toBe(false);
  });

  it("is true only when year, month and day all match", () => {
    expect(isSameDay({ year: 2026, month: 7, day: 15 }, day)).toBe(true);
    expect(isSameDay({ year: 2025, month: 7, day: 15 }, day)).toBe(false);
    expect(isSameDay({ year: 2026, month: 6, day: 15 }, day)).toBe(false);
    expect(isSameDay({ year: 2026, month: 7, day: 14 }, day)).toBe(false);
  });
});

describe("now line", () => {
  it("places the line at the elapsed minutes of the day", () => {
    expect(nowLineOffset(new Date(2026, 6, 15, 13, 30))).toBe(
      13.5 * HOUR_HEIGHT,
    );
  });

  it("starts the scroll two hours above the line", () => {
    expect(initialScrollTop(new Date(2026, 6, 15, 13, 30))).toBe(
      11.5 * HOUR_HEIGHT,
    );
  });

  it("never scrolls above the top", () => {
    expect(initialScrollTop(new Date(2026, 6, 15, 1, 0))).toBe(0);
  });
});
