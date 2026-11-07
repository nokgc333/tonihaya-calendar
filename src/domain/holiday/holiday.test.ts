import { describe, expect, test } from "vitest";
import { getHoliday } from "./holiday";

describe("fixed holidays (2024)", () => {
  test.each([
    [1, 1, "元日"],
    [2, 11, "建国記念の日"],
    [2, 23, "天皇誕生日"],
    [4, 29, "昭和の日"],
    [5, 3, "憲法記念日"],
    [5, 4, "みどりの日"],
    [5, 5, "こどもの日"],
    [8, 11, "山の日"],
    [11, 3, "文化の日"],
    [11, 23, "勤労感謝の日"],
  ])("%d/%d is %s", (m, d, name) => {
    expect(getHoliday(2024, m, d)?.name).toBe(name);
  });
});
