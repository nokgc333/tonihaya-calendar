import type { DayCell, MonthView } from "@/domain/view";
import type { WeekStart } from "@/domain/calendar";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

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

function DayCellView({ cell }: { readonly cell: DayCell }) {
  const base =
    "flex h-6 items-center justify-center text-[11px] leading-none tabular-nums";
  if (cell.isToday) {
    return (
      <div className={base}>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full font-bold"
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
}: {
  readonly month: MonthView;
  readonly weekStart: WeekStart;
}) {
  return (
    <section
      className="rounded-xl border p-3"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
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
            className="flex h-5 items-center justify-center text-[10px] font-medium"
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

      <div className="grid grid-cols-7 gap-y-0.5">
        {month.weeks.flat().map((cell, i) => (
          <DayCellView key={i} cell={cell} />
        ))}
      </div>
    </section>
  );
}
