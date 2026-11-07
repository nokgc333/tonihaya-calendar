import { type CivilDate } from "../shared/date";

export interface Holiday {
  readonly name: string;
  readonly date: CivilDate;
}

function baseHolidays(year: number): Holiday[] {
  const list: Holiday[] = [];
  const add = (month: number, day: number, name: string): void => {
    list.push({ name, date: { year, month, day } });
  };
  add(1, 1, "元日");
  add(2, 11, "建国記念の日");
  add(2, 23, "天皇誕生日");
  add(4, 29, "昭和の日");
  add(5, 3, "憲法記念日");
  add(5, 4, "みどりの日");
  add(5, 5, "こどもの日");
  add(8, 11, "山の日");
  add(11, 3, "文化の日");
  add(11, 23, "勤労感謝の日");
  return list;
}

export function getHoliday(
  year: number,
  month: number,
  day: number,
): Holiday | null {
  return (
    baseHolidays(year).find(
      (h) => h.date.month === month && h.date.day === day,
    ) ?? null
  );
}
