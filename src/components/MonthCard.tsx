import type { DayCell, MonthView } from "@/domain/view";
import type { WeekStart } from "@/domain/calendar";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

// 月は最大6週。年・月によって4〜6週と変動するが、カード高さを一定に保つため
// 常に6行分の行トラックを確保する（不足週は空トラックで高さのみ担保）。
const RESERVED_WEEK_ROWS = 6;

// L0俯瞰は sm、L1単月は lg。行の高さ・文字サイズ・本日円のサイズを切り替える。
export type MonthCardSize = "sm" | "lg";
const SIZE = {
  sm: { row: "1.5rem", dayText: "text-[11px]", circle: "h-6 w-6", weekday: "text-[10px]" },
  lg: { row: "7.59375rem", dayText: "text-base", circle: "h-9 w-9", weekday: "text-xs" },
} as const;

function weekdayHeader(weekStart: WeekStart): readonly string[] {
  return weekStart === "mon"
    ? [...WEEKDAY_LABELS.slice(1), WEEKDAY_LABELS[0]]
    : WEEKDAY_LABELS;
}

function dayColor(cell: DayCell): string {
  if (!cell.inMonth) return "var(--text-faint)";
  if (cell.isSunday || cell.isHoliday) return "var(--accent-red)";
  if (cell.isSaturday) return "var(--accent-sat)";
  return "var(--text)";
}

function DayCellView({ cell, size }: { readonly cell: DayCell; readonly size: MonthCardSize }) {
  const s = SIZE[size];
  const base = `flex h-full items-center justify-center ${s.dayText} leading-none tabular-nums`;
  if (cell.isToday) {
    return (
      <div className={base}>
        <span
          className={`flex ${s.circle} items-center justify-center rounded-full font-bold`}
          style={{ background: "var(--today-bg)", color: "var(--today-fg)" }}
          aria-current="date"
        >
          {cell.day}
        </span>
      </div>
    );
  }
  return (
    <div
      className={base}
      style={{ color: dayColor(cell), opacity: cell.inMonth ? 1 : 0.55 }}
      title={cell.holidayName}
    >
      {cell.day}
    </div>
  );
}

export function MonthCard({
  month,
  weekStart,
  onClick,
  viewTransitionName,
  size = "sm",
}: {
  readonly month: MonthView;
  readonly weekStart: WeekStart;
  readonly onClick?: () => void;
  readonly viewTransitionName?: string;
  readonly size?: MonthCardSize;
}) {
  return (
    <section
      className={`rounded-xl border p-3 text-left ${onClick ? "cursor-pointer transition-colors hover:border-[var(--border-strong)]" : ""}`}
      style={{ borderColor: "var(--border)", background: "var(--surface)", viewTransitionName }}
      onClick={onClick}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } } : {})}
    >
      <header className="mb-2 flex items-baseline gap-2">
        <span className="text-lg font-bold">{month.labelJa}</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {month.labelEn}
        </span>
        <span className="ml-auto text-[11px]" style={{ color: "var(--text-muted)" }}>
          {month.labelWafu}
        </span>
      </header>

      <div className="grid grid-cols-7">
        {weekdayHeader(weekStart).map((label, i) => (
          <div
            key={label}
            className={`flex h-5 items-center justify-center ${SIZE[size].weekday} font-medium`}
            style={{
              color:
                i === (weekStart === "mon" ? 6 : 0)
                  ? "var(--accent-red)"
                  : i === (weekStart === "mon" ? 5 : 6)
                    ? "var(--accent-sat)"
                    : "var(--text-muted)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-y-0.5"
        style={{
          gridTemplateRows: `repeat(${RESERVED_WEEK_ROWS}, ${SIZE[size].row})`,
        }}
      >
        {month.weeks.flat().map((cell, i) => (
          <DayCellView key={i} cell={cell} size={size} />
        ))}
      </div>
    </section>
  );
}
