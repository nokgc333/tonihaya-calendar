import type { CivilDate } from "@/domain/shared/date";
import {
  PeriodNav,
  type PeriodNavControls,
} from "@/components/calendar/PeriodNav";
import { WEEKDAY_JA } from "@/components/common/weekdays";

export function DayNav({
  date,
  weekday,
  ...controls
}: {
  readonly date: CivilDate;
  readonly weekday: number;
} & PeriodNavControls) {
  return (
    <PeriodNav
      level="day"
      navLabel="日の表示の操作"
      backLabel="週に戻る（Escでも戻れます）"
      prevLabel="前の日"
      nextLabel="次の日"
      title={`${date.year}年 ${date.month}月${date.day}日 ${WEEKDAY_JA[weekday]}曜日`}
      titleClassName="min-w-[13rem]"
      className="shrink-0"
      addDate={date}
      {...controls}
    />
  );
}
