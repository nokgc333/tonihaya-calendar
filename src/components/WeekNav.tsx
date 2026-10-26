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

export function WeekNav({
  rangeLabel,
  date,
  weekStart,
  onBack,
  onShift,
  onJump,
  onWeekStartChange,
}: {
  readonly rangeLabel: string;
  readonly date: CivilDate;
  readonly weekStart: WeekStart;
  readonly onBack: () => void;
  readonly onShift: (deltaWeeks: number) => void;
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
        aria-label="月に戻る（Escでも戻れます）"
      >
        ‹ 戻る
      </button>
      <div className="ml-2 flex items-center gap-1.5">
        <StepButton label="前の週" glyph="‹" onClick={() => onShift(-1)} />
        <span className="min-w-[15rem] text-center text-xl font-bold tabular-nums">
          {rangeLabel}
        </span>
        <StepButton label="次の週" glyph="›" onClick={() => onShift(1)} />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <AddEventButton date={date} />
        <LevelSwitcher current="week" onJump={onJump} />
        <SettingsMenu
          weekStart={weekStart}
          onWeekStartChange={onWeekStartChange}
        />
      </div>
    </nav>
  );
}
