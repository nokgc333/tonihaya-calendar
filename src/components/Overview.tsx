"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MAX_YEAR,
  MIN_YEAR,
  buildYearView,
  clampYear,
  resolveYearInput,
} from "@/domain/view";
import { MonthCard } from "@/components/MonthCard";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function weekdayJa(date: CivilDate): string {
  return WEEKDAY_JA[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];
}

export function Overview() {
  const [today, setToday] = useState<CivilDate | null>(null);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  // 入力中は自由に編集できるドラフト。確定時にのみ year へ反映する
  const [yearDraft, setYearDraft] = useState<string>(() => String(new Date().getFullYear()));

  useEffect(() => {
    const now = new Date();
    const current: CivilDate = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
    setToday(current);
    setYear(clampYear(current.year));
  }, []);

  // 年がボタン等で変わったら入力欄の表示も同期する
  useEffect(() => {
    setYearDraft(String(year));
  }, [year]);

  const view = useMemo(
    () => buildYearView(year, today, { weekStart: "sun" }),
    [year, today],
  );

  const shiftYear = (delta: number): void => setYear((y) => clampYear(y + delta));

  // 入力欄の確定（Enter / フォーカスアウト）: クランプして反映、無効なら現在値へ戻す
  const commitYearDraft = (): void => {
    const resolved = resolveYearInput(yearDraft, year);
    setYear(resolved);
    setYearDraft(String(resolved));
  };

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-medium tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            tonihaya-calendar
          </p>
          <h1 className="mt-1 text-2xl font-bold tabular-nums" suppressHydrationWarning>
            {today
              ? `${today.year}年${today.month}月${today.day}日(${weekdayJa(today)})`
              : `${year}年`}
          </h1>
        </div>

        {view.countdowns && (
          <div className="flex flex-wrap gap-2" suppressHydrationWarning>
            <CountdownChip label="土曜まで" value={view.countdowns.toSaturday} />
            <CountdownChip label="月末まで" value={view.countdowns.toMonthEnd} />
            <CountdownChip label="四半期末まで" value={view.countdowns.toQuarterEnd} />
            <CountdownChip label="年末まで" value={view.countdowns.toYearEnd} />
          </div>
        )}
      </header>

      <nav className="mb-5 flex items-center gap-1.5">
        <NavButton onClick={() => shiftYear(-10)} label="‹‹ 10" />
        <NavButton onClick={() => shiftYear(-1)} label="‹ 1" />
        <input
          type="number"
          value={yearDraft}
          min={MIN_YEAR}
          max={MAX_YEAR}
          onChange={(e) => setYearDraft(e.target.value)}
          onBlur={commitYearDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitYearDraft();
              e.currentTarget.blur();
            }
          }}
          className="w-24 rounded-md border bg-transparent px-2 py-1 text-center text-lg font-bold tabular-nums"
          style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
          aria-label="表示する年（Enterで確定）"
        />
        <NavButton onClick={() => shiftYear(1)} label="1 ›" />
        <NavButton onClick={() => shiftYear(10)} label="10 ››" />
        <span className="ml-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
          {MIN_YEAR}–{MAX_YEAR}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {view.months.map((m) => (
          <MonthCard key={m.month} month={m} weekStart="sun" />
        ))}
      </div>
    </main>
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

function NavButton({ onClick, label }: { readonly onClick: () => void; readonly label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-2.5 py-1 text-sm font-medium tabular-nums transition-opacity hover:opacity-70"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      {label}
    </button>
  );
}
