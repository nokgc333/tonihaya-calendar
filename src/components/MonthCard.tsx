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

/** セル背景。色分けは当月のみ（土曜=水色・日祝=赤/ピンク）。前後月・平日は面色。 */
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
  onDayClick,
  cellYear,
  cellMonth,
  pivot,
  jump,
}: {
  readonly cell: DayCell;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly cellYear?: number;
  readonly cellMonth?: number;
  readonly pivot: boolean;
  readonly jump: boolean;
}) {
  const s = SIZE[size];
  const vAlign = spacious ? "items-start pt-1.5" : "items-center";
  const clickable = onDayClick && cellYear !== undefined && cellMonth !== undefined ? "cursor-pointer hover:brightness-95" : "";
  const base = `flex h-full justify-center ${vAlign} ${clickable} ${s.dayText} leading-none tabular-nums`;
  const bgStyle = { background: dayBg(cell) };
  // ピボット日（L1⇄L2の遷移起点）のセルに view-transition-name を付け、週ビュー側の
  // 同名要素とモーフィングさせる。前進・後退の両方で対称にズームする。
  const zoomStyle = pivot
    ? { viewTransitionName: "day-zoom" }
    : jump
      ? { viewTransitionName: "jump-zoom" }
      : null;
  const handlers =
    onDayClick && cellYear !== undefined && cellMonth !== undefined
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick: () => onDayClick(cellYear, cellMonth, cell.day),
          onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onDayClick(cellYear, cellMonth, cell.day);
            }
          },
        }
      : {};
  if (cell.isToday) {
    return (
      <div className={base} style={{ ...bgStyle, ...zoomStyle }} {...handlers}>
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
      style={{ ...bgStyle, ...zoomStyle, color: dayColor(cell), opacity: cell.inMonth ? 1 : 0.55 }}
      title={cell.holidayName}
      {...handlers}
    >
      {cell.day}
    </div>
  );
}

/** セルが前後月にはみ出ている場合の実際の年・月を解決する（DayCellは年月を持たないため）。 */
function resolveCellMonth(
  cells: readonly DayCell[],
  index: number,
  year: number,
  month: number,
): { readonly year: number; readonly month: number } {
  if (cells[index].inMonth) return { year, month };
  const firstInMonthIdx = cells.findIndex((c) => c.inMonth);
  if (index < firstInMonthIdx) {
    return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  }
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function MonthCard({
  month,
  weekStart,
  onClick,
  viewTransitionName,
  size = "sm",
  spacious = false,
  onDayClick,
  year,
  pivotDay,
  jumpDay,
}: {
  readonly month: MonthView;
  readonly weekStart: WeekStart;
  readonly onClick?: () => void;
  readonly viewTransitionName?: string;
  readonly size?: MonthCardSize;
  readonly spacious?: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly year?: number;
  readonly pivotDay?: { readonly year: number; readonly month: number; readonly day: number } | null;
  readonly jumpDay?: { readonly year: number; readonly month: number; readonly day: number } | null;
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
        className={`grid grid-cols-7 gap-px border ${spacious ? "aspect-[7/5.3]" : ""}`}
        style={{
          gridTemplateRows: spacious
            ? `repeat(${RESERVED_WEEK_ROWS}, minmax(0, 1fr))`
            : `repeat(${RESERVED_WEEK_ROWS}, ${SIZE[size].row})`,
          // 1px の隙間に線色(--border)を透けさせて各日の境界線＋薄い外枠にする（L0/L1共通）。
          background: "var(--border)",
          borderColor: "var(--border)",
        }}
      >
        {month.weeks.flat().map((cell, i, cells) => {
          const resolved = year !== undefined ? resolveCellMonth(cells, i, year, month.month) : undefined;
          const isPivot =
            !!pivotDay &&
            !!resolved &&
            resolved.year === pivotDay.year &&
            resolved.month === pivotDay.month &&
            cell.day === pivotDay.day;
          const isJump =
            !!jumpDay &&
            cell.inMonth &&
            !!resolved &&
            resolved.year === jumpDay.year &&
            resolved.month === jumpDay.month &&
            cell.day === jumpDay.day;
          return (
            <DayCellView
              key={i}
              cell={cell}
              size={size}
              spacious={spacious}
              onDayClick={onDayClick}
              cellYear={resolved?.year}
              cellMonth={resolved?.month}
              pivot={isPivot}
              jump={isJump}
            />
          );
        })}
      </div>
    </section>
  );
}
