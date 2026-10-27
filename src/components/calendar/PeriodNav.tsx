import type { JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { StepButton } from "@/components/common/StepButton";
import { ViewActions } from "@/components/calendar/ViewActions";

export interface PeriodNavControls {
  readonly weekStart: WeekStart;
  readonly onBack: () => void;
  readonly onShift: (delta: -1 | 1) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
}

export function PeriodNav({
  level,
  navLabel,
  backLabel,
  prevLabel,
  nextLabel,
  title,
  titleClassName,
  className = "",
  addDate,
  weekStart,
  onBack,
  onShift,
  onJump,
  onWeekStartChange,
}: {
  readonly level: JumpLevel;
  readonly navLabel: string;
  readonly backLabel: string;
  readonly prevLabel: string;
  readonly nextLabel: string;
  readonly title: string;
  readonly titleClassName: string;
  readonly className?: string;
  readonly addDate: CivilDate;
} & PeriodNavControls) {
  return (
    <nav
      aria-label={navLabel}
      className={`mb-5 flex min-h-10 flex-wrap items-center gap-2 ${className}`}
    >
      <button
        type="button"
        onClick={onBack}
        className="rounded-md border px-3 py-1 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
        aria-label={backLabel}
      >
        ‹ 戻る
      </button>
      <div className="ml-2 flex items-center gap-1.5">
        <StepButton label={prevLabel} glyph="‹" onClick={() => onShift(-1)} />
        <span
          className={`${titleClassName} text-center text-xl font-bold tabular-nums`}
        >
          {title}
        </span>
        <StepButton label={nextLabel} glyph="›" onClick={() => onShift(1)} />
      </div>
      <ViewActions
        level={level}
        addDate={addDate}
        weekStart={weekStart}
        onJump={onJump}
        onWeekStartChange={onWeekStartChange}
      />
    </nav>
  );
}
