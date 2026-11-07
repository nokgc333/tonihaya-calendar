import type { MonthDetail as MonthDetailModel } from "@/domain/view";
import { weekdayLabel } from "@/components/month/monthDetailModel";

function Stat({
  label,
  value,
  unit,
}: {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-lg leading-none font-bold tabular-nums">
        {value}
        <span
          className="ml-0.5 text-[10px] font-normal"
          style={{ color: "var(--text-muted)" }}
        >
          {unit}
        </span>
      </span>
    </div>
  );
}

function PanelHeading({ detail }: { readonly detail: MonthDetailModel }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <span className="text-2xl font-bold">{detail.month.labelJa}</span>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {detail.month.labelEn} / {detail.month.labelWafu}
      </span>
    </div>
  );
}

function StatGrid({ detail }: { readonly detail: MonthDetailModel }) {
  return (
    <div className="mb-4 grid grid-cols-4 justify-items-start gap-2">
      <Stat label="祝日" value={detail.holidayCount} unit="日" />
      <Stat label="総日数" value={detail.dayCount} unit="日" />
      <Stat label="営業日" value={detail.businessDayCount} unit="日" />
      <Stat label="営業日残" value={detail.businessDaysRemaining} unit="日" />
    </div>
  );
}

function HolidayRows({
  holidays,
}: {
  readonly holidays: MonthDetailModel["holidays"];
}) {
  if (holidays.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-faint)" }}>
        祝日なし
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {holidays.map((h) => (
        <li
          key={`${h.date.month}-${h.date.day}-${h.name}`}
          className="grid grid-cols-[4.75rem_1fr] items-baseline gap-2 text-sm"
        >
          <span className="tabular-nums" style={{ color: "var(--accent-red)" }}>
            {h.date.month}/{h.date.day}
            <span
              className="ml-1 text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              ({weekdayLabel(h.date)})
            </span>
          </span>
          <span>{h.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function MonthSummaryPanel({
  detail,
}: {
  readonly detail: MonthDetailModel;
}) {
  return (
    <aside
      aria-label="月の概要と祝日"
      className="w-full max-w-[800px] rounded-xl border p-4 min-[1168px]:w-auto min-[1168px]:max-w-none min-[1168px]:flex-1"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <PanelHeading detail={detail} />
      <StatGrid detail={detail} />
      <h2
        className="mb-2 text-xs font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        祝日
      </h2>
      <HolidayRows holidays={detail.holidays} />
    </aside>
  );
}
