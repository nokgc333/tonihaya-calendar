import type { CivilDate } from "@/domain/shared/date";
import { toEpochDay } from "@/domain/shared/date";

export interface Wareki {
  readonly name: string;
  readonly year: number;
}

interface EraDef {
  readonly name: string;
  readonly startEpoch: number;
  readonly baseYear: number;
}

const ERAS: readonly EraDef[] = [
  { name: "令和", startEpoch: toEpochDay(2019, 5, 1), baseYear: 2018 },
  { name: "平成", startEpoch: toEpochDay(1989, 1, 8), baseYear: 1988 },
  { name: "昭和", startEpoch: toEpochDay(1926, 12, 25), baseYear: 1925 },
] as const;

export function toWareki(date: CivilDate): Wareki {
  const epoch = toEpochDay(date.year, date.month, date.day);
  const era = ERAS.find((e) => epoch >= e.startEpoch) ?? ERAS[ERAS.length - 1];
  return { name: era.name, year: date.year - era.baseYear };
}

export function formatWarekiYear(date: CivilDate): string {
  const { name, year } = toWareki(date);
  return `${name}${year === 1 ? "元" : year}年`;
}

export function formatYearWithEra(date: CivilDate): string {
  return `${date.year}年(${formatWarekiYear(date)})`;
}
