import type { DayCell, MonthView } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import type { CalendarEvent } from "@/domain/event";
import { eventsForDay, sortForDay } from "@/domain/event";
import { dayBgColor, dayTextColor } from "@/components/dayPalette";
import { WEEKDAY_JA } from "@/components/weekdays";
import { EventChip } from "@/components/EventChip";
import { eventColor } from "@/components/eventColors";

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
    ? [...WEEKDAY_JA.slice(1), WEEKDAY_JA[0]]
    : WEEKDAY_JA;
}

/** セル文字色。前後月はフェイント、当月は共通パレット（日祝=赤・土=青・平日=標準）。 */
function dayColor(cell: DayCell): string {
  if (!cell.inMonth) return "var(--text-faint)";
  return dayTextColor(cell);
}

/** セル背景。前後月・平日は面色、当月の土日祝は共通パレット（土=水色・日祝=赤/ピンク）。 */
function dayBg(cell: DayCell): string {
  if (!cell.inMonth) return "var(--surface)";
  return dayBgColor(cell);
}

function DayCellView({
  cell,
  size,
  spacious,
  onDayClick,
  cellYear,
  cellMonth,
  jump,
  dayEvents = [],
  onEventSelect,
}: {
  readonly cell: DayCell;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly cellYear?: number;
  readonly cellMonth?: number;
  readonly jump: boolean;
  readonly dayEvents?: readonly CalendarEvent[];
  readonly onEventSelect?: (id: string) => void;
}) {
  const s = SIZE[size];
  const vAlign = spacious ? "items-start pt-1.5" : "items-center";
  const clickable = onDayClick && cellYear !== undefined && cellMonth !== undefined ? "cursor-pointer hover:brightness-95" : "";
  const base = `flex h-full justify-center ${vAlign} ${clickable} ${s.dayText} leading-none tabular-nums`;
  const bgStyle = { background: dayBg(cell) };
  // 多段ジャンプ（jump-zoom）の起点セルにのみ view-transition-name を付ける。
  // L1⇄L2 の day-zoom は「押下日が属する週の行」（週ラッパー）が担う（MonthCard 本体側）。
  const zoomStyle = jump
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

  const numberNode = cell.isToday ? (
    <span
      className={`flex ${s.circle} items-center justify-center rounded-full font-bold`}
      style={{ background: "var(--today-bg)", color: "var(--today-fg)" }}
      aria-current="date"
    >
      {cell.day}
    </span>
  ) : (
    <span style={{ color: dayColor(cell) }}>{cell.day}</span>
  );

  // L1（spacious）で当月セルにイベントがあれば、番号の下にチップ（最大3件＋「+N件」）を出す。
  const MAX_CHIPS = 3;
  const showChips = spacious && cell.inMonth && dayEvents.length > 0;
  if (showChips) {
    const overflow = dayEvents.length - MAX_CHIPS;
    return (
      <div
        className={`flex h-full flex-col overflow-hidden ${clickable} ${s.dayText} leading-none tabular-nums`}
        style={{ ...bgStyle, ...zoomStyle }}
        {...handlers}
      >
        <div className="flex justify-center pt-1.5">{numberNode}</div>
        <div className="mt-0.5 min-h-0 space-y-0.5 px-0.5">
          {dayEvents.slice(0, MAX_CHIPS).map((e) => (
            <EventChip key={e.id} event={e} onSelect={onEventSelect} />
          ))}
          {overflow > 0 ? (
            <div className="px-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
              +{overflow}件
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // L0（sm）で当月セルにイベントがあれば、番号レイアウトは変えず下端に点（最大3）を重ねる。
  const showDots = !spacious && cell.inMonth && dayEvents.length > 0;

  return (
    <div
      className={`relative ${base}`}
      style={{
        ...bgStyle,
        ...zoomStyle,
        ...(cell.isToday ? {} : { color: dayColor(cell) }),
        opacity: cell.inMonth ? 1 : 0.55,
      }}
      title={cell.holidayName}
      {...handlers}
    >
      {cell.isToday ? numberNode : cell.day}
      {showDots ? (
        <div className="pointer-events-none absolute bottom-0.5 flex gap-0.5">
          {dayEvents.slice(0, 3).map((e) => (
            <span
              key={e.id}
              className="h-1 w-1 rounded-full"
              style={{ background: eventColor(e.colorKey).border }}
            />
          ))}
        </div>
      ) : null}
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
  events,
  onEventSelect,
}: {
  readonly month: MonthView;
  readonly weekStart: WeekStart;
  readonly onClick?: () => void;
  readonly viewTransitionName?: string;
  readonly size?: MonthCardSize;
  readonly spacious?: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly year?: number;
  readonly pivotDay?: CivilDate | null;
  readonly jumpDay?: CivilDate | null;
  readonly events?: readonly CalendarEvent[];
  readonly onEventSelect?: (id: string) => void;
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
        {(() => {
          const flat = month.weeks.flat();
          // 押下日（pivotDay）が属する週かどうか。
          const isPivotWeek = (week: readonly DayCell[], wi: number): boolean =>
            year !== undefined &&
            !!pivotDay &&
            week.some((cell, ci) => {
              const r = resolveCellMonth(flat, wi * 7 + ci, year, month.month);
              return r.year === pivotDay.year && r.month === pivotDay.month && cell.day === pivotDay.day;
            });
          const renderCell = (cell: DayCell, wi: number, ci: number, interactive: boolean) => {
            const i = wi * 7 + ci;
            const resolved = year !== undefined ? resolveCellMonth(flat, i, year, month.month) : undefined;
            const isJump =
              interactive &&
              !!jumpDay &&
              cell.inMonth &&
              !!resolved &&
              resolved.year === jumpDay.year &&
              resolved.month === jumpDay.month &&
              cell.day === jumpDay.day;
            // イベントは本物セル（interactive）の当月分のみ。複製オーバーレイには渡さない。
            // L0(sm)は点、L1(lg)はチップに使うため sm/lg 双方で計算する。
            const dayEvents =
              interactive && events && cell.inMonth && resolved
                ? sortForDay(
                    eventsForDay(events, {
                      year: resolved.year,
                      month: resolved.month,
                      day: cell.day,
                    }),
                  )
                : undefined;
            return (
              <DayCellView
                key={ci}
                cell={cell}
                size={size}
                spacious={spacious}
                onDayClick={interactive ? onDayClick : undefined}
                cellYear={resolved?.year}
                cellMonth={resolved?.month}
                jump={isJump}
                dayEvents={dayEvents}
                onEventSelect={onEventSelect}
              />
            );
          };
          return month.weeks.map((week, wi) => (
            <div
              key={wi}
              className="relative isolate col-span-7 grid grid-cols-subgrid gap-px"
              style={{ background: "var(--border)" }}
            >
              {week.map((cell, ci) => renderCell(cell, wi, ci, true))}
              {isPivotWeek(week, wi) && (
                // day-zoom は「本物の週」ではなく、その背面に敷いた複製オーバーレイに張る。
                // 本物は root に残って遷移中も表示され続ける（着地側のグレー穴を防ぐ）一方、
                // 複製が持ち上がって L2 週ヘッダー行へモーフする（進む・戻る両方向でズーム）。
                // -z-10 で本物セルの背面に置く（isolate で親に閉じ込め）。本物が上に来るので
                // ホバー/クリックは本物に効き、複製は View Transition のスナップショット専用になる。
                // 複製は inset-0 で本物にぴったり重なる。列トラックは subgrid だと
                // スナップショットで潰れるため grid-cols-7 で自己完結させる。
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 grid grid-cols-7 gap-px"
                  style={{ background: "var(--border)", viewTransitionName: "day-zoom" }}
                >
                  {week.map((cell, ci) => renderCell(cell, wi, ci, false))}
                </div>
              )}
            </div>
          ));
        })()}
      </div>
    </section>
  );
}
