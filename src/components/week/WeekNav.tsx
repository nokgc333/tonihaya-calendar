import type { CivilDate } from "@/domain/shared/date";
import {
  PeriodNav,
  type PeriodNavControls,
} from "@/components/calendar/PeriodNav";

export function WeekNav({
  rangeLabel,
  date,
  ...controls
}: {
  readonly rangeLabel: string;
  readonly date: CivilDate;
} & PeriodNavControls) {
  return (
    <PeriodNav
      level="week"
      navLabel="週の表示の操作"
      backLabel="月に戻る（Escでも戻れます）"
      prevLabel="前の週"
      nextLabel="次の週"
      title={rangeLabel}
      titleClassName="min-w-[15rem]"
      className="shrink-0"
      addDate={date}
      {...controls}
    />
  );
}
