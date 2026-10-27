import type { JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { LevelSwitcher } from "@/components/common/LevelSwitcher";
import { SettingsMenu } from "@/components/common/SettingsMenu";
import { AddEventButton } from "@/components/event/AddEventButton";

export function ViewActions({
  level,
  addDate,
  weekStart,
  onJump,
  onWeekStartChange,
  children,
}: {
  readonly level: JumpLevel;
  readonly addDate: CivilDate;
  readonly weekStart: WeekStart;
  readonly onJump: (level: JumpLevel) => void;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly children?: React.ReactNode;
}) {
  return (
    <div className="ml-auto flex items-center gap-3">
      {children}
      <AddEventButton date={addDate} />
      <LevelSwitcher current={level} onJump={onJump} />
      <SettingsMenu
        weekStart={weekStart}
        onWeekStartChange={onWeekStartChange}
      />
    </div>
  );
}
