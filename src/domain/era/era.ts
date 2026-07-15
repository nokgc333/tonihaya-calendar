import type { CivilDate } from "@/domain/shared/date";
import { toEpochDay } from "@/domain/shared/date";

/** 元号（名称と元号年）。 */
export interface Wareki {
  readonly name: string;
  readonly year: number;
}

interface EraDef {
  readonly name: string;
  /** 改元日の通日（この日以降が当該元号）。 */
  readonly startEpoch: number;
  /** 元号年 = 西暦年 - baseYear（元年 = startYear のとき year=1）。 */
  readonly baseYear: number;
}

// 対応年 1950–2150 は 昭和/平成/令和 で網羅。境界は「日付」で判定する
// （改元は年途中で起きるため。例: 2019/4/30=平成31 / 2019/5/1=令和元）。
// 2019/5/1 以降・未来（〜2150）は令和が続く前提。新しい順に並べる。
const ERAS: readonly EraDef[] = [
  { name: "令和", startEpoch: toEpochDay(2019, 5, 1), baseYear: 2018 },
  { name: "平成", startEpoch: toEpochDay(1989, 1, 8), baseYear: 1988 },
  { name: "昭和", startEpoch: toEpochDay(1926, 12, 25), baseYear: 1925 },
] as const;

/** 西暦の暦日を元号（名称・元号年）へ変換する。境界は改元日で判定。 */
export function toWareki(date: CivilDate): Wareki {
  const epoch = toEpochDay(date.year, date.month, date.day);
  // 新しい順に並んだ配列から、改元日が当日以前の最初の元号を選ぶ。
  // 対応範囲(1950–)は必ず昭和以降に該当する。範囲外(昭和より前)は最古の昭和にフォールバック。
  const era = ERAS.find((e) => epoch >= e.startEpoch) ?? ERAS[ERAS.length - 1];
  return { name: era.name, year: date.year - era.baseYear };
}

/** 元号年の表記（初年は「元年」）。例: 令和元年 / 令和8年。 */
export function formatWarekiYear(date: CivilDate): string {
  const { name, year } = toWareki(date);
  return `${name}${year === 1 ? "元" : year}年`;
}

/** 「西暦年(元号年)」の表記。例: 2026年(令和8年)。 */
export function formatYearWithEra(date: CivilDate): string {
  return `${date.year}年(${formatWarekiYear(date)})`;
}
