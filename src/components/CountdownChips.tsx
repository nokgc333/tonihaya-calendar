import type { Countdown } from "@/domain/countdown";

/** 本日基準の遊びセクション（土曜/月末/四半期末/年末まで）のチップ群 */
export function CountdownChips({ countdowns }: { readonly countdowns: Countdown }) {
  return (
    <div className="flex flex-wrap gap-2">
      <CountdownChip label="土曜まで" value={countdowns.toSaturday} />
      <CountdownChip label="月末まで" value={countdowns.toMonthEnd} />
      <CountdownChip label="四半期末まで" value={countdowns.toQuarterEnd} />
      <CountdownChip label="年末まで" value={countdowns.toYearEnd} />
    </div>
  );
}

function CountdownChip({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div
      className="rounded-lg border px-3 py-1.5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="ml-1.5 text-base font-bold tabular-nums">{value}</span>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        日
      </span>
    </div>
  );
}
