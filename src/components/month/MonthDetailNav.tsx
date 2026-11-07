import type { CivilDate } from "@/domain/shared/date";
import {
  PeriodNav,
  type PeriodNavControls,
} from "@/components/calendar/PeriodNav";

export function MonthDetailNav({
  year,
  month,
  addDate,
  ...controls
}: {
  readonly year: number;
  readonly month: number;
  readonly addDate: CivilDate;
} & PeriodNavControls) {
  return (
    <PeriodNav
      level="month"
      navLabel="月の表示の操作"
      backLabel="俯瞰に戻る（Escでも戻れます）"
      prevLabel="前の月"
      nextLabel="次の月"
      title={`${year}年 ${month}月`}
      titleClassName="min-w-[8rem]"
      addDate={addDate}
      {...controls}
    />
  );
}
