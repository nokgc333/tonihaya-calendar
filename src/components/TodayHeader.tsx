import type { Countdown } from "@/domain/countdown";
import type { CivilDate } from "@/domain/shared/date";
import { formatYearWithEra } from "@/domain/era";
import { CountdownChips } from "@/components/CountdownChips";
import { WEEKDAY_JA } from "@/components/weekdays";

function weekdayJa(date: CivilDate): string {
  return WEEKDAY_JA[
    new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
  ];
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
        <p
          className="text-[11px] font-medium tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          tonihaya-calendar
        </p>
        <h1
          className="mt-1 text-2xl font-bold tabular-nums"
          suppressHydrationWarning
        >
          {today
            ? `${formatYearWithEra(today)} ${today.month}月${today.day}日 ${weekdayJa(today)}曜日`
            : ""}
        </h1>
      </div>
      {countdowns && (
        <div className="max-[712px]:hidden" suppressHydrationWarning>
          <CountdownChips countdowns={countdowns} />
        </div>
      )}
    </header>
  );
}
