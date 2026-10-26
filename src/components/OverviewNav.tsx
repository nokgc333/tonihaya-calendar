import type { JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { SettingsMenu } from "@/components/SettingsMenu";
import { AddEventButton } from "@/components/AddEventButton";
import { YearStepper } from "@/components/YearStepper";
import {
  LayoutToggle,
  type OverviewLayout,
} from "@/components/OverviewControls";

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
    <nav className="mb-5 flex min-h-10 flex-wrap items-center gap-1.5">
      <YearStepper year={year} today={today} onYearChange={onYearChange} />
      <div className="ml-auto flex items-center gap-3">
        <LayoutToggle layout={layout} onLayoutChange={onLayoutChange} />
        <AddEventButton
          date={isCurrentYear && today ? today : { year, month: 1, day: 1 }}
        />
        <LevelSwitcher current="overview" onJump={onJump} />
        <SettingsMenu
          weekStart={weekStart}
          onWeekStartChange={onWeekStartChange}
        />
      </div>
    </nav>
  );
}
