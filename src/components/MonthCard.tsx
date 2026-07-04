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

/** 単月(spacious)のセル背景。色分けは当月のみ。前後月・平日は面色。 */
function dayBg(cell: DayCell): string {
  if (!cell.inMonth) return "var(--surface)";
  if (cell.isSunday || cell.isHoliday) return "var(--sun-bg)";
  if (cell.isSaturday) return "var(--sat-bg)";
  return "var(--surface)";
}

function DayCellView({
  cell,
  size,
  spacious,
}: {
  readonly cell: DayCell;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
}) {
  const s = SIZE[size];
  // ゆったり表示時は日付を上端寄せにし、下部に予定を入れる余白を残す。
  const vAlign = spacious ? "items-start pt-1.5" : "items-center";
  const base = `flex h-full justify-center ${vAlign} ${s.dayText} leading-none tabular-nums`;
  // 罫線が見えるよう常にセル背景を敷く。spacious は当月の土日祝を色分けする。
  const bgStyle = { background: spacious ? dayBg(cell) : "var(--surface)" };
  if (cell.isToday) {
    return (
      <div className={base} style={bgStyle}>
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
      style={{ ...bgStyle, color: dayColor(cell), opacity: cell.inMonth ? 1 : 0.55 }}
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
  spacious = false,
}: {
  readonly month: MonthView;
  readonly weekStart: WeekStart;
  readonly onClick?: () => void;
  readonly viewTransitionName?: string;
  readonly size?: MonthCardSize;
  readonly spacious?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border p-3 text-left ${onClick ? "cursor-pointer transition-colors hover:border-[var(--border-strong)]" : ""}`}
      style={{ borderColor: "var(--border)", background: "var(--surface)", viewTransitionName }}
      onClick={onClick}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } } : {})}
    >
      <header className={`flex items-baseline gap-2 ${size === "lg" ? "mb-3" : "mb-2"}`}>
        <span className={`font-bold ${size === "lg" ? "text-2xl" : "text-lg"}`}>
          {month.labelJa}
        </span>
        {size === "lg" ? (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {month.labelEn} / {month.labelWafu}
          </span>
        ) : (
          <>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {month.labelEn}
            </span>
            <span className="ml-auto text-[11px]" style={{ color: "var(--text-muted)" }}>
              {month.labelWafu}
            </span>
          </>
        )}
      </header>

      <div className="grid grid-cols-7 pb-1.5">
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
        className={`grid grid-cols-7 gap-px overflow-hidden rounded-md border ${spacious ? "aspect-[7/5.3]" : ""}`}
        style={{
          gridTemplateRows: spacious
            ? `repeat(${RESERVED_WEEK_ROWS}, minmax(0, 1fr))`
            : `repeat(${RESERVED_WEEK_ROWS}, ${SIZE[size].row})`,
          // 1px の隙間に線色(--border)を透けさせて各日の境界線＋薄い外枠にする（L0/L1共通）。
          background: "var(--border)",
          borderColor: "var(--border)",
        }}
      >
        {month.weeks.flat().map((cell, i) => (
          <DayCellView key={i} cell={cell} size={size} spacious={spacious} />
        ))}
      </div>
    </section>
  );
}
