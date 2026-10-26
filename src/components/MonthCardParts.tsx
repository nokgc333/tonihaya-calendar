import type { MonthView } from "@/domain/view";
import type { WeekStart } from "@/domain/calendar";
import { WEEKDAY_JA } from "@/components/weekdays";
import { SIZE, type MonthCardSize } from "@/components/monthCardSize";

const SUNDAY_FIRST_SATURDAY_INDEX = 6;
const MONDAY_FIRST_SATURDAY_INDEX = 5;
const MONDAY_FIRST_SUNDAY_INDEX = 6;

function weekdayHeader(weekStart: WeekStart): readonly string[] {
  return weekStart === "mon"
    ? [...WEEKDAY_JA.slice(1), WEEKDAY_JA[0]]
    : WEEKDAY_JA;
}

function weekdayColor(index: number, weekStart: WeekStart): string {
  const sundayIndex = weekStart === "mon" ? MONDAY_FIRST_SUNDAY_INDEX : 0;
  const saturdayIndex =
    weekStart === "mon"
      ? MONDAY_FIRST_SATURDAY_INDEX
      : SUNDAY_FIRST_SATURDAY_INDEX;
  if (index === sundayIndex) return "var(--accent-red)";
  if (index === saturdayIndex) return "var(--accent-sat)";
  return "var(--text-muted)";
}

export function MonthCardHeader({
  month,
  size,
}: {
  readonly month: MonthView;
  readonly size: MonthCardSize;
}) {
  return (
    <header
      className={`flex items-baseline gap-2 ${size === "lg" ? "mb-3" : "mb-2"}`}
    >
      <h2 className={`font-bold ${size === "lg" ? "text-2xl" : "text-lg"}`}>
        {month.labelJa}
      </h2>
      {size === "lg" ? (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {month.labelEn} / {month.labelWafu}
        </span>
      ) : (
        <>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {month.labelEn}
          </span>
          <span
            className="ml-auto text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            {month.labelWafu}
          </span>
        </>
      )}
    </header>
  );
}

export function WeekdayRow({
  weekStart,
  size,
}: {
  readonly weekStart: WeekStart;
  readonly size: MonthCardSize;
}) {
  return (
    <div className="grid grid-cols-7 pb-1.5">
      {weekdayHeader(weekStart).map((label, i) => (
        <div
          key={label}
          className={`flex h-5 items-center justify-center ${SIZE[size].weekday} font-medium`}
          style={{ color: weekdayColor(i, weekStart) }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
