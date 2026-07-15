import { describe, expect, test } from "vitest";
import { toWareki, formatWarekiYear, formatYearWithEra } from "./era";

describe("toWareki（西暦→元号・元号年、境界は日付で判定）", () => {
  test("令和: 開始日 2019-05-01 は令和元年", () => {
    expect(toWareki({ year: 2019, month: 5, day: 1 })).toEqual({ name: "令和", year: 1 });
  });
  test("令和: 2026-07-15 は令和8年", () => {
    expect(toWareki({ year: 2026, month: 7, day: 15 })).toEqual({ name: "令和", year: 8 });
  });
  test("令和: 対応上限側 2150-01-01 も令和が続く前提", () => {
    expect(toWareki({ year: 2150, month: 1, day: 1 })).toEqual({ name: "令和", year: 132 });
  });

  test("平成: 令和前日 2019-04-30 は平成31年", () => {
    expect(toWareki({ year: 2019, month: 4, day: 30 })).toEqual({ name: "平成", year: 31 });
  });
  test("平成: 開始日 1989-01-08 は平成元年", () => {
    expect(toWareki({ year: 1989, month: 1, day: 8 })).toEqual({ name: "平成", year: 1 });
  });

  test("昭和: 平成前日 1989-01-07 は昭和64年", () => {
    expect(toWareki({ year: 1989, month: 1, day: 7 })).toEqual({ name: "昭和", year: 64 });
  });
  test("昭和: 対応下限側 1950-01-01 は昭和25年", () => {
    expect(toWareki({ year: 1950, month: 1, day: 1 })).toEqual({ name: "昭和", year: 25 });
  });
});

describe("formatWarekiYear（初年は「元年」）", () => {
  test("令和元年", () => {
    expect(formatWarekiYear({ year: 2019, month: 5, day: 1 })).toBe("令和元年");
  });
  test("令和8年", () => {
    expect(formatWarekiYear({ year: 2026, month: 7, day: 15 })).toBe("令和8年");
  });
  test("平成元年（1989-01-08）", () => {
    expect(formatWarekiYear({ year: 1989, month: 1, day: 8 })).toBe("平成元年");
  });
  test("昭和64年（1989-01-07）", () => {
    expect(formatWarekiYear({ year: 1989, month: 1, day: 7 })).toBe("昭和64年");
  });
});

describe("formatYearWithEra（「西暦年(元号年)」）", () => {
  test("2026年(令和8年)", () => {
    expect(formatYearWithEra({ year: 2026, month: 7, day: 15 })).toBe("2026年(令和8年)");
  });
  test("2019年(令和元年) 2019-05-01", () => {
    expect(formatYearWithEra({ year: 2019, month: 5, day: 1 })).toBe("2019年(令和元年)");
  });
  test("2019年(平成31年) 2019-04-30", () => {
    expect(formatYearWithEra({ year: 2019, month: 4, day: 30 })).toBe("2019年(平成31年)");
  });
});
