/** 祝日 */
export interface Holiday {
  readonly name: string;
  readonly date: { readonly year: number; readonly month: number; readonly day: number };
}

import { fromEpochDay, toEpochDay, weekdayOf } from "../shared/date";

const MONDAY = 1;
const SUNDAY = 0;

/** その月の第n・指定曜日の「日」を返す（weekday: 0=日 … 6=土） */
function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const firstWeekday = weekdayOf(year, month, 1);
  const offset = (weekday - firstWeekday + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

/** 春分の日（1980年基準の近似式・実用範囲は概ね1980–2099） */
function shunbunDay(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/** 秋分の日（同上） */
function shubunDay(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/** 振替・国民の休日を除いた基本の国民の祝日 */
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

const epochOf = (h: Holiday): number => toEpochDay(h.date.year, h.date.month, h.date.day);
const holidayAt = (epoch: number, name: string): Holiday => ({ name, date: fromEpochDay(epoch) });

/** 指定年の全祝日（振替・国民の休日を含む・日付昇順） */
function computeYearHolidays(year: number): Holiday[] {
  const base = baseHolidays(year);
  const baseEpochs = new Set(base.map(epochOf));
  const extra: Holiday[] = [];
  const claimed = new Set(baseEpochs);

  // 国民の休日: 祝日に挟まれた平日（日曜以外）
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

  // 振替休日: 祝日が日曜 → その後の最初の非祝日
  for (const holiday of base) {
    const { year: y, month: m, day: d } = holiday.date;
    if (weekdayOf(y, m, d) !== SUNDAY) continue;
    let next = epochOf(holiday) + 1;
    while (claimed.has(next)) next += 1;
    extra.push(holidayAt(next, "振替休日"));
    claimed.add(next);
  }

  return [...base, ...extra]
    .filter((h) => h.date.year === year)
    .sort((a, b) => epochOf(a) - epochOf(b));
}

/** 指定日の祝日を返す（なければ null） */
export function getHoliday(year: number, month: number, day: number): Holiday | null {
  return (
    computeYearHolidays(year).find(
      (h) => h.date.month === month && h.date.day === day,
    ) ?? null
  );
}

/** 指定日が祝日か */
export function isHoliday(year: number, month: number, day: number): boolean {
  return getHoliday(year, month, day) !== null;
}

/** 指定年の祝日一覧（振替含む・日付昇順） */
export function getHolidaysInYear(year: number): Holiday[] {
  return computeYearHolidays(year);
}
