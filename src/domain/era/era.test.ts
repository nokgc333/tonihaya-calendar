import { describe, expect, test } from "vitest";
import { toWareki, formatWarekiYear, formatYearWithEra } from "./era";

describe("toWareki (Gregorian to era and era year, boundaries decided by date)", () => {
  test("Reiwa: the start date 2019-05-01 is Reiwa 1", () => {
    expect(toWareki({ year: 2019, month: 5, day: 1 })).toEqual({
      name: "令和",
      year: 1,
    });
  });
  test("Reiwa: 2026-07-15 is Reiwa 8", () => {
    expect(toWareki({ year: 2026, month: 7, day: 15 })).toEqual({
      name: "令和",
      year: 8,
    });
  });
  test("Reiwa: Reiwa continues at the supported upper bound 2150-01-01", () => {
    expect(toWareki({ year: 2150, month: 1, day: 1 })).toEqual({
      name: "令和",
      year: 132,
    });
  });

  test("Heisei: 2019-04-30, the day before Reiwa, is Heisei 31", () => {
    expect(toWareki({ year: 2019, month: 4, day: 30 })).toEqual({
      name: "平成",
      year: 31,
    });
  });
  test("Heisei: the start date 1989-01-08 is Heisei 1", () => {
    expect(toWareki({ year: 1989, month: 1, day: 8 })).toEqual({
      name: "平成",
      year: 1,
    });
  });

  test("Showa: 1989-01-07, the day before Heisei, is Showa 64", () => {
    expect(toWareki({ year: 1989, month: 1, day: 7 })).toEqual({
      name: "昭和",
      year: 64,
    });
  });
  test("Showa: the supported lower bound 1950-01-01 is Showa 25", () => {
    expect(toWareki({ year: 1950, month: 1, day: 1 })).toEqual({
      name: "昭和",
      year: 25,
    });
  });
});

describe('formatWarekiYear (the first year is written as "gannen")', () => {
  test("Reiwa 1", () => {
    expect(formatWarekiYear({ year: 2019, month: 5, day: 1 })).toBe("令和元年");
  });
  test("Reiwa 8", () => {
    expect(formatWarekiYear({ year: 2026, month: 7, day: 15 })).toBe("令和8年");
  });
  test("Heisei 1 (1989-01-08)", () => {
    expect(formatWarekiYear({ year: 1989, month: 1, day: 8 })).toBe("平成元年");
  });
  test("Showa 64 (1989-01-07)", () => {
    expect(formatWarekiYear({ year: 1989, month: 1, day: 7 })).toBe("昭和64年");
  });
});

describe('formatYearWithEra ("Gregorian year (era year)")', () => {
  test("2026 (Reiwa 8)", () => {
    expect(formatYearWithEra({ year: 2026, month: 7, day: 15 })).toBe(
      "2026年(令和8年)",
    );
  });
  test("2019 (Reiwa 1) on 2019-05-01", () => {
    expect(formatYearWithEra({ year: 2019, month: 5, day: 1 })).toBe(
      "2019年(令和元年)",
    );
  });
  test("2019 (Heisei 31) on 2019-04-30", () => {
    expect(formatYearWithEra({ year: 2019, month: 4, day: 30 })).toBe(
      "2019年(平成31年)",
    );
  });
});
