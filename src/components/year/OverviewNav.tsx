import type { JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { ViewActions } from "@/components/calendar/ViewActions";
import { YearStepper } from "@/components/year/YearStepper";
import {
  LayoutToggle,
  type OverviewLayout,
} from "@/components/year/OverviewControls";

export function OverviewNav({
  year,
  today,
  layout,
  weekStart,
  onYearChange,
  onLayoutChange,
  onJump,
  onWeekStartChange,
}: {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly layout: OverviewLayout;
  readonly weekStart: WeekStart;
  readonly onYearChange: (year: number) => void;
  readonly onLayoutChange: (layout: OverviewLayout) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
}) {
  const isCurrentYear = today !== null && year === today.year;
  return (
    <nav
      aria-label="年の表示の操作"
      className="mb-5 flex min-h-10 flex-wrap items-center gap-1.5"
    >
      <YearStepper year={year} today={today} onYearChange={onYearChange} />
      <ViewActions
        level="overview"
        addDate={isCurrentYear && today ? today : { year, month: 1, day: 1 }}
        weekStart={weekStart}
        onJump={onJump}
        onWeekStartChange={onWeekStartChange}
      >
        <LayoutToggle layout={layout} onLayoutChange={onLayoutChange} />
      </ViewActions>
    </nav>
  );
}
