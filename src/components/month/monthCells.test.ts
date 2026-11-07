import { describe, expect, it } from "vitest";
import { buildMonthView } from "@/domain/view";
import { resolveCellMonth } from "./monthCells";

const month = (year: number, m: number) => buildMonthView(year, m, null, "sun");

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
