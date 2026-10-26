import type { JumpLevel } from "@/domain/view";
import type { WeekStart } from "@/domain/calendar";
import type { CivilDate } from "@/domain/shared/date";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { SettingsMenu } from "@/components/SettingsMenu";
import { AddEventButton } from "@/components/AddEventButton";

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

export function MonthDetailNav({
  year,
  month,
  addDate,
  weekStart,
  onBack,
  onShift,
  onJump,
  onWeekStartChange,
}: {
  readonly year: number;
  readonly month: number;
  readonly addDate: CivilDate;
  readonly weekStart: WeekStart;
  readonly onBack: () => void;
  readonly onShift: (delta: -1 | 1) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
}) {
  return (
    <nav className="mb-5 flex min-h-10 flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="rounded-md border px-3 py-1 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
        aria-label="俯瞰に戻る（Escでも戻れます）"
      >
        ‹ 戻る
      </button>
      <div className="ml-2 flex items-center gap-1.5">
        <StepButton label="前の月" glyph="‹" onClick={() => onShift(-1)} />
        <span className="min-w-[8rem] text-center text-xl font-bold tabular-nums">
          {year}年 {month}月
        </span>
        <StepButton label="次の月" glyph="›" onClick={() => onShift(1)} />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <AddEventButton date={addDate} />
        <LevelSwitcher current="month" onJump={onJump} />
        <SettingsMenu
          weekStart={weekStart}
          onWeekStartChange={onWeekStartChange}
        />
      </div>
    </nav>
  );
}
