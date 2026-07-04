"use client";

import { useEffect } from "react";
import { buildMonthDetail } from "@/domain/view";
import { MonthCard } from "@/components/MonthCard";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function MonthDetail({
  year,
  month,
  today,
  onBack,
  onMonthChange,
}: {
  readonly year: number;
  readonly month: number;
  readonly today: CivilDate | null;
  readonly onBack: () => void;
  readonly onMonthChange: (month: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const detail = buildMonthDetail(year, month, today, { weekStart: "sun" });

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2">
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
            onClick={() => onMonthChange(month === 1 ? 12 : month - 1)}
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
            onClick={() => onMonthChange(month === 12 ? 1 : month + 1)}
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="次の月"
          >
            ›
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div style={{ viewTransitionName: `month-${month}` }}>
          <MonthCard month={detail.month} weekStart="sun" size="lg" />
        </div>

        <aside
          className="self-start rounded-xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{detail.month.labelJa}</span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {detail.month.labelEn} / {detail.month.labelWafu}
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-3">
            <Stat label="祝日" value={detail.holidayCount} unit="件" />
            <Stat label="総日数" value={detail.dayCount} unit="日" />
            <Stat label="営業日" value={detail.businessDayCount} unit="日" />
            <Stat label="営業日残" value={detail.businessDaysRemaining} unit="日" />
          </div>
          <h2 className="mb-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            祝日
          </h2>
          {detail.holidays.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>祝日なし</p>
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
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-2xl font-bold leading-none tabular-nums">
        {value}
        <span className="ml-0.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
          {unit}
        </span>
      </span>
    </div>
  );
}
