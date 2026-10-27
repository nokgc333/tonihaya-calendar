import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { getMonthGrid } from "@/domain/calendar";
import { getCountdowns } from "@/domain/countdown";
import { formatYearWithEra, toWareki } from "@/domain/era";
import {
  getHoliday,
  getHolidaysInMonth,
  getHolidaysInYear,
  isHoliday,
} from "@/domain/holiday";
import { daysInMonth } from "@/domain/calendar";
import { fromEpochDay, toEpochDay, weekdayOf } from "@/domain/shared/date";
import { buildMonthView, buildWeekView } from "@/domain/view";
import { APP_YEARS, appDate, weekStart, yearIn } from "./arbitraries";

const SUNDAY = 0;
const SATURDAY = 6;
const epochOf = (d: { year: number; month: number; day: number }) =>
  toEpochDay(d.year, d.month, d.day);

describe("the month grid", () => {
  const month = fc.integer({ min: 1, max: 12 });

  it("always has six weeks of seven consecutive days", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const days = getMonthGrid(year, m, start).flat();
        expect(getMonthGrid(year, m, start)).toHaveLength(6);
        expect(days).toHaveLength(42);
        for (let i = 1; i < days.length; i += 1) {
          expect(epochOf(days[i]) - epochOf(days[i - 1])).toBe(1);
        }
      }),
    );
  });

  it("holds every day of the month once, as the days that are in the month", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const inside = getMonthGrid(year, m, start)
          .flat()
          .filter((d) => d.inMonth);
        expect(inside.map((d) => d.day)).toEqual(
          Array.from({ length: daysInMonth(year, m) }, (_, i) => i + 1),
        );
      }),
    );
  });

  it("starts each week on the chosen weekday, and carries the right weekday on every day", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const weeks = getMonthGrid(year, m, start);
        for (const week of weeks) {
          expect(week[0].weekday).toBe(start === "sun" ? SUNDAY : 1);
          for (const d of week)
            expect(d.weekday).toBe(weekdayOf(d.year, d.month, d.day));
        }
      }),
    );
  });

  it("begins with the week that holds the first of the month", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const first = getMonthGrid(year, m, start)
          .flat()
          .findIndex((d) => d.inMonth);
        expect(first).toBeLessThan(7);
      }),
    );
  });

  it("marks exactly one day as today when today is in the month and none otherwise", () => {
    fc.assert(
      fc.property(
        appDate,
        weekStart,
        fc.integer({ min: 1, max: 12 }),
        (today, start, m) => {
          const view = buildMonthView(today.year, m, today, start);
          const marked = view.weeks.flat().filter((c) => c.isToday);
          expect(marked).toHaveLength(m === today.month ? 1 : 0);
          if (marked.length === 1) {
            expect(marked[0].day).toBe(today.day);
            expect(marked[0].inMonth).toBe(true);
          }
        },
      ),
    );
  });
});

describe("the week view", () => {
  it("has seven consecutive days that include the day it was opened on", () => {
    fc.assert(
      fc.property(appDate, weekStart, (ref, start) => {
        const { days } = buildWeekView(ref, null, { weekStart: start });
        expect(days).toHaveLength(7);
        for (let i = 1; i < 7; i += 1)
          expect(epochOf(days[i]) - epochOf(days[i - 1])).toBe(1);
        expect(days.some((d) => epochOf(d) === epochOf(ref))).toBe(true);
        expect(days[0].weekday).toBe(start === "sun" ? SUNDAY : 1);
      }),
    );
  });

  it("flags Saturday, Sunday and today on the right days only", () => {
    fc.assert(
      fc.property(appDate, (ref) => {
        const { days } = buildWeekView(ref, ref, { weekStart: "sun" });
        for (const d of days) {
          expect(d.isSunday).toBe(d.weekday === SUNDAY);
          expect(d.isSaturday).toBe(d.weekday === SATURDAY);
          expect(d.isToday).toBe(epochOf(d) === epochOf(ref));
        }
      }),
    );
  });
});

describe("the holidays of a year", () => {
  const years = yearIn(APP_YEARS);

  it("fall inside the year, in order, each date once", () => {
    fc.assert(
      fc.property(years, (year) => {
        const list = getHolidaysInYear(year);
        for (const h of list) expect(h.date.year).toBe(year);
        const epochs = list.map((h) => epochOf(h.date));
        expect(epochs).toEqual([...epochs].sort((a, b) => a - b));
        expect(new Set(epochs).size).toBe(epochs.length);
      }),
    );
  });

  it("are dates that exist", () => {
    fc.assert(
      fc.property(years, (year) => {
        for (const h of getHolidaysInYear(year)) {
          expect(h.date.day).toBeGreaterThanOrEqual(1);
          expect(h.date.day).toBeLessThanOrEqual(
            daysInMonth(year, h.date.month),
          );
          expect(fromEpochDay(epochOf(h.date))).toEqual(h.date);
        }
      }),
    );
  });

  it("are the same whether asked for by year, by month or by day", () => {
    fc.assert(
      fc.property(years, (year) => {
        const byMonth = Array.from({ length: 12 }, (_, i) =>
          getHolidaysInMonth(year, i + 1),
        ).flat();
        expect(byMonth).toEqual(getHolidaysInYear(year));
        for (const h of getHolidaysInYear(year)) {
          expect(isHoliday(year, h.date.month, h.date.day)).toBe(true);
          expect(getHoliday(year, h.date.month, h.date.day)?.name).toBe(h.name);
        }
      }),
    );
  });

  it("always include New Year's Day and Constitution Day", () => {
    fc.assert(
      fc.property(years, (year) => {
        expect(getHoliday(year, 1, 1)?.name).toBe("元日");
        expect(getHoliday(year, 5, 3)?.name).toBe("憲法記念日");
      }),
    );
  });

  it("place the equinox days on the days that the observatory gives, for the years that are known", () => {
    const known: Array<[number, number, number]> = [
      [1950, 21, 23],
      [1960, 20, 23],
      [1970, 21, 23],
      [1980, 20, 23],
      [1999, 21, 23],
      [2020, 20, 22],
      [2021, 20, 23],
      [2022, 21, 23],
      [2023, 21, 23],
      [2024, 20, 22],
      [2025, 20, 23],
      [2030, 20, 23],
    ];
    for (const [year, spring, autumn] of known) {
      expect(getHoliday(year, 3, spring)?.name, `${year} spring`).toBe(
        "春分の日",
      );
      expect(getHoliday(year, 9, autumn)?.name, `${year} autumn`).toBe(
        "秋分の日",
      );
    }
  });

  it("keep the equinox days apart from the other holidays of the month, in every year", () => {
    fc.assert(
      fc.property(years, (year) => {
        const autumn = getHolidaysInMonth(year, 9).filter(
          (h) => h.name === "秋分の日",
        );
        const spring = getHolidaysInMonth(year, 3).filter(
          (h) => h.name === "春分の日",
        );
        expect(autumn).toHaveLength(1);
        expect(spring).toHaveLength(1);
      }),
    );
  });

  it("carry a holiday that falls on a Sunday over to a day that is a holiday too", () => {
    fc.assert(
      fc.property(years, (year) => {
        for (const h of getHolidaysInYear(year)) {
          if (weekdayOf(h.date.year, h.date.month, h.date.day) !== SUNDAY)
            continue;
          const next = fromEpochDay(epochOf(h.date) + 1);
          if (next.year !== year) continue;
          expect(isHoliday(next.year, next.month, next.day)).toBe(true);
        }
      }),
    );
  });

  it("place a citizens' holiday only between two other holidays", () => {
    fc.assert(
      fc.property(years, (year) => {
        for (const h of getHolidaysInYear(year).filter(
          (x) => x.name === "国民の休日",
        )) {
          const before = fromEpochDay(epochOf(h.date) - 1);
          const after = fromEpochDay(epochOf(h.date) + 1);
          expect(isHoliday(before.year, before.month, before.day)).toBe(true);
          expect(isHoliday(after.year, after.month, after.day)).toBe(true);
        }
      }),
    );
  });

  it("never number more than a handful beyond the national list", () => {
    fc.assert(
      fc.property(years, (year) => {
        const count = getHolidaysInYear(year).length;
        expect(count).toBeGreaterThanOrEqual(16);
        expect(count).toBeLessThanOrEqual(22);
      }),
    );
  });
});

describe("the countdowns", () => {
  it("count the days to the next Saturday as a number from 0 to 6 that reaches a Saturday", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        const c = getCountdowns(d.year, d.month, d.day);
        expect(c.toSaturday).toBeGreaterThanOrEqual(0);
        expect(c.toSaturday).toBeLessThanOrEqual(6);
        const saturday = fromEpochDay(epochOf(d) + c.toSaturday);
        expect(weekdayOf(saturday.year, saturday.month, saturday.day)).toBe(
          SATURDAY,
        );
      }),
    );
  });

  it("count the days to the end of the month and to the end of the year exactly", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        const c = getCountdowns(d.year, d.month, d.day);
        const monthEnd = fromEpochDay(epochOf(d) + c.toMonthEnd);
        expect([monthEnd.year, monthEnd.month, monthEnd.day]).toEqual([
          d.year,
          d.month,
          daysInMonth(d.year, d.month),
        ]);
        const yearEnd = fromEpochDay(epochOf(d) + c.toYearEnd);
        expect([yearEnd.year, yearEnd.month, yearEnd.day]).toEqual([
          d.year,
          12,
          31,
        ]);
      }),
    );
  });

  it("keep the remaining business days, which do not include today, between none and the days left, and never count a holiday or a weekend", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        const c = getCountdowns(d.year, d.month, d.day);
        expect(c.remainingBusinessDays).toBeGreaterThanOrEqual(0);
        expect(c.remainingBusinessDays).toBeLessThanOrEqual(c.toMonthEnd);
        let expected = 0;
        for (
          let day = d.day + 1;
          day <= daysInMonth(d.year, d.month);
          day += 1
        ) {
          const w = weekdayOf(d.year, d.month, day);
          if (
            w !== SATURDAY &&
            w !== SUNDAY &&
            !isHoliday(d.year, d.month, day)
          )
            expected += 1;
        }
        expect(c.remainingBusinessDays).toBe(expected);
      }),
    );
  });

  it("never gain business days as the month goes on", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        if (d.day === daysInMonth(d.year, d.month)) return;
        const today = getCountdowns(
          d.year,
          d.month,
          d.day,
        ).remainingBusinessDays;
        const tomorrow = getCountdowns(
          d.year,
          d.month,
          d.day + 1,
        ).remainingBusinessDays;
        expect(tomorrow).toBeLessThanOrEqual(today);
        expect(today - tomorrow).toBeLessThanOrEqual(1);
      }),
    );
  });
});

describe("the era", () => {
  const ERA_STARTS = [
    { name: "昭和", at: [1926, 12, 25] },
    { name: "平成", at: [1989, 1, 8] },
    { name: "令和", at: [2019, 5, 1] },
  ] as const;

  it("changes on the day an era begins and on no other day", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        const before = fromEpochDay(epochOf(d) - 1);
        const changes = toWareki(before).name !== toWareki(d).name;
        const starts = ERA_STARTS.some(
          ({ at }) => at[0] === d.year && at[1] === d.month && at[2] === d.day,
        );
        expect(changes).toBe(starts);
      }),
    );
  });

  it("never goes back to an earlier era as the dates go on", () => {
    const order = ["昭和", "平成", "令和"];
    fc.assert(
      fc.property(appDate, fc.integer({ min: 1, max: 4000 }), (d, n) => {
        const later = fromEpochDay(epochOf(d) + n);
        expect(order.indexOf(toWareki(later).name)).toBeGreaterThanOrEqual(
          order.indexOf(toWareki(d).name),
        );
      }),
    );
  });

  it("counts the year of the era from its start, one more with each calendar year", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        const next = fromEpochDay(epochOf(d) + 365);
        const a = toWareki(d);
        const b = toWareki(next);
        if (a.name === b.name) expect(b.year - a.year).toBe(next.year - d.year);
      }),
    );
  });

  it("never gives a year before the first of its era, from the start of Showa on", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        if (epochOf(d) < toEpochDay(1926, 12, 25)) return;
        expect(toWareki(d).year).toBeGreaterThanOrEqual(1);
      }),
    );
  });

  it("writes the Gregorian year and the era in the label", () => {
    fc.assert(
      fc.property(appDate, (d) => {
        const label = formatYearWithEra(d);
        expect(label).toContain(String(d.year));
        expect(label).toContain(toWareki(d).name);
      }),
    );
  });
});
