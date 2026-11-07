import { describe, expect, it } from "vitest";
import { describeZoom } from "@/components/calendar/describeZoom";

describe("describeZoom", () => {
  it("names the year for the overview", () => {
    expect(describeZoom({ level: "overview", year: 2026 })).toBe(
      "2026年の一覧を表示しています",
    );
  });

  it("names the month", () => {
    expect(describeZoom({ level: "month", year: 2026, month: 7 })).toBe(
      "2026年7月を表示しています",
    );
  });

  it("names the week by the day that it is opened on", () => {
    expect(describeZoom({ level: "week", year: 2026, month: 7, day: 15 })).toBe(
      "2026年7月15日の週を表示しています",
    );
  });

  it("names the day with its weekday", () => {
    expect(describeZoom({ level: "day", year: 2026, month: 7, day: 15 })).toBe(
      "2026年7月15日 水曜日を表示しています",
    );
  });

  it("falls back to the year when the month or day is missing", () => {
    expect(describeZoom({ level: "month", year: 2026 })).toBe(
      "2026年の一覧を表示しています",
    );
    expect(describeZoom({ level: "day", year: 2026, month: 7 })).toBe(
      "2026年の一覧を表示しています",
    );
  });
});
