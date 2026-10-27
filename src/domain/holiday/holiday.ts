import {
  fromEpochDay,
  toEpochDay,
  weekdayOf,
  type CivilDate,
} from "../shared/date";

export interface Holiday {
  readonly name: string;
  readonly date: CivilDate;
}

const MONDAY = 1;
const SUNDAY = 0;

function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number,
): number {
  const firstWeekday = weekdayOf(year, month, 1);
  const offset = (weekday - firstWeekday + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

const EQUINOX_RATE = 0.242194;
const REFERENCE_YEAR = 1980;
const LAST_YEAR_OF_FIRST_FORMULA = 1979;
const LAST_YEAR_OF_SECOND_FORMULA = 2099;

interface EquinoxFormula {
  readonly base: number;
  readonly leapShift: (year: number) => number;
}

const leapFrom1983 = (year: number): number => Math.trunc((year - 1983) / 4);
const leapFrom1980 = (year: number): number => Math.floor((year - 1980) / 4);

function equinoxFormula(
  year: number,
  bases: readonly [number, number, number],
): EquinoxFormula {
  if (year <= LAST_YEAR_OF_FIRST_FORMULA) {
    return { base: bases[0], leapShift: leapFrom1983 };
  }
  if (year <= LAST_YEAR_OF_SECOND_FORMULA) {
    return { base: bases[1], leapShift: leapFrom1980 };
  }
  return { base: bases[2], leapShift: leapFrom1980 };
}

function equinoxDay(
  year: number,
  bases: readonly [number, number, number],
): number {
  const { base, leapShift } = equinoxFormula(year, bases);
  return Math.floor(
    base + EQUINOX_RATE * (year - REFERENCE_YEAR) - leapShift(year),
  );
}

const SHUNBUN_BASES = [20.8357, 20.8431, 21.851] as const;
const SHUBUN_BASES = [23.2588, 23.2488, 24.2488] as const;

function shunbunDay(year: number): number {
  return equinoxDay(year, SHUNBUN_BASES);
}

function shubunDay(year: number): number {
  return equinoxDay(year, SHUBUN_BASES);
}

function baseHolidays(year: number): Holiday[] {
  const list: Holiday[] = [];
  const add = (month: number, day: number, name: string): void => {
    list.push({ name, date: { year, month, day } });
  };
  add(1, 1, "元日");
  add(1, nthWeekday(year, 1, MONDAY, 2), "成人の日");
  add(2, 11, "建国記念の日");
  add(2, 23, "天皇誕生日");
  add(3, shunbunDay(year), "春分の日");
  add(4, 29, "昭和の日");
  add(5, 3, "憲法記念日");
  add(5, 4, "みどりの日");
  add(5, 5, "こどもの日");
  add(7, nthWeekday(year, 7, MONDAY, 3), "海の日");
  add(8, 11, "山の日");
  add(9, nthWeekday(year, 9, MONDAY, 3), "敬老の日");
  add(9, shubunDay(year), "秋分の日");
  add(10, nthWeekday(year, 10, MONDAY, 2), "スポーツの日");
  add(11, 3, "文化の日");
  add(11, 23, "勤労感謝の日");
  return list;
}

const epochOf = (h: Holiday): number =>
  toEpochDay(h.date.year, h.date.month, h.date.day);
const holidayAt = (epoch: number, name: string): Holiday => ({
  name,
  date: fromEpochDay(epoch),
});

const yearHolidayCache = new Map<number, readonly Holiday[]>();

function computeYearHolidays(year: number): readonly Holiday[] {
  const cached = yearHolidayCache.get(year);
  if (cached !== undefined) return cached;
  const base = baseHolidays(year);
  const baseEpochs = new Set(base.map(epochOf));
  const extra: Holiday[] = [];
  const claimed = new Set(baseEpochs);

  for (const holiday of base) {
    const candidate = epochOf(holiday) + 1;
    const { year: y, month: m, day: d } = fromEpochDay(candidate);
    if (
      !baseEpochs.has(candidate) &&
      baseEpochs.has(candidate + 1) &&
      weekdayOf(y, m, d) !== SUNDAY
    ) {
      extra.push(holidayAt(candidate, "国民の休日"));
      claimed.add(candidate);
    }
  }

  for (const holiday of base) {
    const { year: y, month: m, day: d } = holiday.date;
    if (weekdayOf(y, m, d) !== SUNDAY) continue;
    let next = epochOf(holiday) + 1;
    while (claimed.has(next)) next += 1;
    extra.push(holidayAt(next, "振替休日"));
    claimed.add(next);
  }

  const result: readonly Holiday[] = [...base, ...extra]
    .filter((h) => h.date.year === year)
    .sort((a, b) => epochOf(a) - epochOf(b));
  yearHolidayCache.set(year, result);
  return result;
}

export function getHoliday(
  year: number,
  month: number,
  day: number,
): Holiday | null {
  return (
    computeYearHolidays(year).find(
      (h) => h.date.month === month && h.date.day === day,
    ) ?? null
  );
}

export function isHoliday(year: number, month: number, day: number): boolean {
  return getHoliday(year, month, day) !== null;
}

export function getHolidaysInYear(year: number): Holiday[] {
  return [...computeYearHolidays(year)];
}

export function getHolidaysInMonth(year: number, month: number): Holiday[] {
  return getHolidaysInYear(year).filter((h) => h.date.month === month);
}
