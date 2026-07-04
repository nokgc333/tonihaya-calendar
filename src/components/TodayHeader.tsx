import type { Countdown } from "@/domain/countdown";
import { CountdownChips } from "@/components/CountdownChips";

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
      {/* 遊びセクションは狭幅(≤712px)では単月ビュー内に移すため、ここでは非表示にする */}
      {countdowns && (
        <div className="max-[712px]:hidden" suppressHydrationWarning>
          <CountdownChips countdowns={countdowns} />
        </div>
      )}
    </header>
  );
}
