import { toEpochDay } from "../shared/date";
import { KYUREKI_FIRST_YEAR, KYUREKI_ROWS } from "./table";

export interface Kyureki {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly leap: boolean;
}

const FIRST_SUPPORTED_YEAR = KYUREKI_FIRST_YEAR + 1;
const LAST_SUPPORTED_YEAR = KYUREKI_FIRST_YEAR + KYUREKI_ROWS.length - 1;
const MONTHS_PER_YEAR = 12;
const SHORT_MONTH_DAYS = 29;

export function toKyureki(
  year: number,
  month: number,
  day: number,
): Kyureki | null {
  if (
    !Number.isInteger(year) ||
    year < FIRST_SUPPORTED_YEAR ||
    year > LAST_SUPPORTED_YEAR
  ) {
    return null;
  }
  const epoch = toEpochDay(year, month, day);
  let lunarYear = year;
  let row = KYUREKI_ROWS[lunarYear - KYUREKI_FIRST_YEAR];
  let start = toEpochDay(lunarYear, 1, 1) + row[0];
  if (epoch < start) {
    lunarYear -= 1;
    row = KYUREKI_ROWS[lunarYear - KYUREKI_FIRST_YEAR];
    start = toEpochDay(lunarYear, 1, 1) + row[0];
  }
  let remaining = epoch - start;
  const [, leapMonth, bits] = row;
  const monthCount = leapMonth === 0 ? MONTHS_PER_YEAR : MONTHS_PER_YEAR + 1;
  for (let i = 0; i < monthCount; i += 1) {
    const length = SHORT_MONTH_DAYS + ((bits >> i) & 1);
    if (remaining < length) {
      const repeated = leapMonth !== 0 && i >= leapMonth;
      return {
        year: lunarYear,
        month: i + 1 - Number(repeated),
        day: remaining + 1,
        leap: repeated && i === leapMonth,
      };
    }
    remaining -= length;
  }
  return null;
}
