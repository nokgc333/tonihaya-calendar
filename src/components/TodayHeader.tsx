import type { Countdown } from "@/domain/countdown";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function weekdayJa(date: CivilDate): string {
  return WEEKDAY_JA[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];
}

export function TodayHeader({
  today,
  countdowns,
}: {
  readonly today: CivilDate | null;
  readonly countdowns: Countdown | null;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
          tonihaya-calendar
        </p>
        <h1 className="mt-1 text-2xl font-bold tabular-nums" suppressHydrationWarning>
          {today ? `${today.year}年${today.month}月${today.day}日(${weekdayJa(today)})` : ""}
        </h1>
      </div>
      {countdowns && (
        <div className="flex flex-wrap gap-2" suppressHydrationWarning>
          <CountdownChip label="土曜まで" value={countdowns.toSaturday} />
          <CountdownChip label="月末まで" value={countdowns.toMonthEnd} />
          <CountdownChip label="四半期末まで" value={countdowns.toQuarterEnd} />
          <CountdownChip label="年末まで" value={countdowns.toYearEnd} />
        </div>
      )}
    </header>
  );
}

function CountdownChip({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-lg border px-3 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="ml-1.5 text-base font-bold tabular-nums">{value}</span>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>日</span>
    </div>
  );
}
