import { describe, expect, it } from "vitest";
import {
  dateDifference,
  datePlusMinus,
  durationPlusMinus,
  formatDuration,
  parseCount,
  parseDate,
  parseTime,
  timeDifference,
  timePlusMinus,
} from "@/components/calc/calcModel";

describe("the examples of the requirements", () => {
  it("14:30 + 0:45 = 15:15", () => {
    expect(timePlusMinus("14:30", 1, "0", "45")).toBe("15:15");
  });

  it("09:00 to 17:30 = 8 hours 30 minutes", () => {
    expect(timeDifference("09:00", "17:30")).toBe("8時間30分");
  });

  it("7/4 + 30 days, and 7/4 to 12/31", () => {
    expect(datePlusMinus("2026-07-04", 1, "30")).toBe("2026年8月3日（月）");
    expect(dateDifference("2026-07-04", "2026-12-31")).toBe("180日");
  });

  it("1:20 + 2:50 = 4:10", () => {
    const a = { hours: "1", minutes: "20" };
    const b = { hours: "2", minutes: "50" };
    expect(durationPlusMinus(a, 1, b)).toBe("4時間10分");
  });
});

describe("the boundaries", () => {
  it("names the day that a time crosses into", () => {
    expect(timePlusMinus("23:30", 1, "0", "45")).toBe("0:15（翌日）");
    expect(timePlusMinus("00:15", -1, "0", "30")).toBe("23:45（前日）");
    expect(timePlusMinus("12:00", 1, "50", "0")).toBe("14:00（2日後）");
    expect(timePlusMinus("12:00", -1, "50", "0")).toBe("10:00（2日前）");
  });

  it("goes over the end of a month, a leap day and the end of a year", () => {
    expect(datePlusMinus("2023-02-28", 1, "1")).toBe("2023年3月1日（水）");
    expect(datePlusMinus("2024-02-28", 1, "1")).toBe("2024年2月29日（木）");
    expect(datePlusMinus("2024-12-31", 1, "1")).toBe("2025年1月1日（水）");
    expect(datePlusMinus("2025-01-01", -1, "1")).toBe("2024年12月31日（火）");
  });

  it("gives a negative difference of dates and of durations a minus sign", () => {
    expect(dateDifference("2026-12-31", "2026-07-04")).toBe("−180日");
    const a = { hours: "1", minutes: "20" };
    const b = { hours: "2", minutes: "50" };
    expect(durationPlusMinus(a, -1, b)).toBe("−1時間30分");
    expect(durationPlusMinus(b, -1, a)).toBe("1時間30分");
  });

  it("counts a time that ends before it starts as the next day, and the same time as zero", () => {
    expect(timeDifference("23:00", "01:00")).toBe("2時間");
    expect(timeDifference("09:00", "09:00")).toBe("0分");
  });

  it("leaves the hours or the minutes empty as zero", () => {
    expect(timePlusMinus("10:00", 1, "", "15")).toBe("10:15");
    expect(timePlusMinus("10:00", 1, "2", "")).toBe("12:00");
  });
});

describe("incomplete or invalid input", () => {
  it("gives no result until every field is valid", () => {
    expect(timePlusMinus("", 1, "1", "0")).toBeNull();
    expect(timeDifference("09:00", "")).toBeNull();
    expect(datePlusMinus("2026-07-04", 1, "")).toBeNull();
    expect(dateDifference("", "2026-07-04")).toBeNull();
    expect(
      durationPlusMinus({ hours: "x", minutes: "" }, 1, {
        hours: "1",
        minutes: "",
      }),
    ).toBeNull();
  });

  it("rejects what is not a time, a date or a count", () => {
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("12:60")).toBeNull();
    expect(parseTime("9:5")).toBeNull();
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("2026-13-01")).toBeNull();
    expect(parseDate("0000-01-01")).toBeNull();
    expect(parseCount("-1")).toBeNull();
    expect(parseCount("1.5")).toBeNull();
    expect(parseCount("100000")).toBeNull();
    expect(parseCount(" 12 ")).toBe(12);
  });

  it("does not leave the years that the dates can show", () => {
    expect(datePlusMinus("9999-12-31", 1, "1")).toBeNull();
    expect(datePlusMinus("0001-01-01", -1, "1")).toBeNull();
  });

  it("writes only the minutes, or only the hours, when the other is zero", () => {
    expect(formatDuration({ hours: 0, minutes: 45 })).toBe("45分");
    expect(formatDuration({ hours: 3, minutes: 0 })).toBe("3時間");
  });
});
