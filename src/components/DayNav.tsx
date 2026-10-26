import type { JumpLevel } from "@/domain/view";
import type { WeekStart } from "@/domain/calendar";
import type { CivilDate } from "@/domain/shared/date";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { SettingsMenu } from "@/components/SettingsMenu";
import { AddEventButton } from "@/components/AddEventButton";
import { WEEKDAY_JA } from "@/components/weekdays";

function StepButton({
  label,
  glyph,
  onClick,
}: {
  readonly label: string;
  readonly glyph: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
      aria-label={label}
    >
      {glyph}
    </button>
  );
}

export function DayNav({
  date,
  weekday,
  weekStart,
  onBack,
  onShift,
  onJump,
  onWeekStartChange,
}: {
  readonly date: CivilDate;
  readonly weekday: number;
  readonly weekStart: WeekStart;
  readonly onBack: () => void;
  readonly onShift: (delta: number) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
}) {
  return (
    <nav className="mb-5 flex min-h-10 shrink-0 flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="rounded-md border px-3 py-1 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
        aria-label="週に戻る（Escでも戻れます）"
      >
        ‹ 戻る
      </button>
      <div className="ml-2 flex items-center gap-1.5">
        <StepButton label="前の日" glyph="‹" onClick={() => onShift(-1)} />
        <span className="min-w-[13rem] text-center text-xl font-bold tabular-nums">
          {date.year}年 {date.month}月{date.day}日 {WEEKDAY_JA[weekday]}曜日
        </span>
        <StepButton label="次の日" glyph="›" onClick={() => onShift(1)} />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <AddEventButton date={date} />
        <LevelSwitcher current="day" onJump={onJump} />
        <SettingsMenu
          weekStart={weekStart}
          onWeekStartChange={onWeekStartChange}
        />
      </div>
    </nav>
  );
}
