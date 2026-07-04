"use client";

import { useEffect } from "react";
import { buildMonthDetail } from "@/domain/view";
import type { Countdown } from "@/domain/countdown";
import { MonthCard } from "@/components/MonthCard";
import { CountdownChips } from "@/components/CountdownChips";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

// 幅はラッパー(CalendarApp)側で制御する。ここでは横並び(≥1168px)でカレンダー800/aside320に固定し、
// それ未満では縦積み（各要素はラッパー幅いっぱい）にする。
const SIDE_BY_SIDE = "min-[1168px]:flex-row min-[1168px]:items-start";

export function MonthDetail({
  year,
  month,
  today,
  countdowns,
  onBack,
  onMonthChange,
}: {
  readonly year: number;
  readonly month: number;
  readonly today: CivilDate | null;
  readonly countdowns: Countdown | null;
  readonly onBack: () => void;
  readonly onMonthChange: (year: number, month: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const detail = buildMonthDetail(year, month, today, { weekStart: "sun" });

  return (
    <div>
      <nav className="mb-4 flex min-h-10 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-3 py-1 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          aria-label="俯瞰に戻る（Escでも戻れます）"
        >
          ‹ 俯瞰へ
        </button>
        <div className="ml-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              month === 1 ? onMonthChange(year - 1, 12) : onMonthChange(year, month - 1)
            }
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="前の月"
          >
            ‹
          </button>
          <span className="min-w-[7rem] text-center text-xl font-bold tabular-nums">
            {year}年{month}月
          </span>
          <button
            type="button"
            onClick={() =>
              month === 12 ? onMonthChange(year + 1, 1) : onMonthChange(year, month + 1)
            }
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="次の月"
          >
            ›
          </button>
        </div>
      </nav>

      {/* 収まる幅では [カレンダー | aside] 横並び。収まらない幅では aside をカレンダー下へ。 */}
      <div className={`flex flex-col gap-4 ${SIDE_BY_SIDE}`}>
        <div
          className="w-full max-w-[800px] min-[1168px]:w-[800px] min-[1168px]:max-w-none min-[1168px]:shrink-0"
          style={{ viewTransitionName: `month-${month}` }}
        >
          <MonthCard month={detail.month} weekStart="sun" size="lg" spacious />
        </div>

        {/* 遊びセクションは ≤712px のときだけカレンダー直下・aside直上に表示する（幅いっぱい・2行中央）。 */}
        {countdowns && (
          <div className="w-full max-w-[800px] min-[713px]:hidden">
            <CountdownChips countdowns={countdowns} block />
          </div>
        )}

        {/* aside はカードUIを維持しつつ背景を少し明るく(--surface-2)してカレンダーと区別する。
            横並び時はラッパー右端まで広げ、ヘッダーと左右余白を揃える。 */}
        <aside
          className="w-full max-w-[800px] rounded-xl border p-4 min-[1168px]:w-auto min-[1168px]:max-w-none min-[1168px]:flex-1"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{detail.month.labelJa}</span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {detail.month.labelEn} / {detail.month.labelWafu}
            </span>
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2">
            <Stat label="祝日" value={detail.holidayCount} unit="日" />
            <Stat label="総日数" value={detail.dayCount} unit="日" />
            <Stat label="営業日" value={detail.businessDayCount} unit="日" />
            <Stat label="営業日残" value={detail.businessDaysRemaining} unit="日" />
          </div>
          <h2 className="mb-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            祝日
          </h2>
          {detail.holidays.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              祝日なし
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {detail.holidays.map((h) => (
                <li
                  key={`${h.date.month}-${h.date.day}-${h.name}`}
                  className="grid grid-cols-[4.75rem_1fr] items-baseline gap-2 text-sm"
                >
                  <span className="tabular-nums" style={{ color: "var(--accent-red)" }}>
                    {h.date.month}/{h.date.day}
                    <span className="ml-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ({WEEKDAY_JA[new Date(Date.UTC(h.date.year, h.date.month - 1, h.date.day)).getUTCDay()]})
                    </span>
                  </span>
                  <span>{h.name}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col items-end gap-0.5 text-right">
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-lg font-bold leading-none tabular-nums">
        {value}
        <span className="ml-0.5 text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
          {unit}
        </span>
      </span>
    </div>
  );
}
