import type { ZoomState } from "@/domain/view";
import { WEEKDAY_JA } from "@/components/common/weekdays";
import { weekdayOf } from "@/domain/shared/date";

function yearOverview(year: number): string {
  return `${year}年の一覧を表示しています`;
}

export function describeZoom(zoom: ZoomState): string {
  const { level, year, month, day } = zoom;
  if (level === "overview" || month === undefined) return yearOverview(year);
  if (level === "month") return `${year}年${month}月を表示しています`;
  if (day === undefined) return yearOverview(year);
  if (level === "week")
    return `${year}年${month}月${day}日の週を表示しています`;
  const weekday = WEEKDAY_JA[weekdayOf(year, month, day)];
  return `${year}年${month}月${day}日 ${weekday}曜日を表示しています`;
}
