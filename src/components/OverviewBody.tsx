"use client";

import { MAX_YEAR, MIN_YEAR, buildYearView, clampYear, resolveYearInput } from "@/domain/view";
import { MonthCard } from "@/components/MonthCard";
import { useEffect, useState } from "react";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function OverviewBody({
  year,
  today,
  onYearChange,
  onMonthClick,
}: {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly onYearChange: (year: number) => void;
  readonly onMonthClick: (month: number) => void;
}) {
  const [yearDraft, setYearDraft] = useState<string>(String(year));
  useEffect(() => setYearDraft(String(year)), [year]);

  const view = buildYearView(year, today, { weekStart: "sun" });
  const isCurrentYear = today !== null && year === today.year;

  const commitYearDraft = (): void => onYearChange(resolveYearInput(yearDraft, year));

  return (
    <>
      <nav className="mb-5 flex items-center gap-1.5">
        <NavButton onClick={() => onYearChange(clampYear(year - 10))} label="‹‹ 10" />
        <NavButton onClick={() => onYearChange(clampYear(year - 1))} label="‹ 1" />
        <input
          type="number"
          value={yearDraft}
          min={MIN_YEAR}
          max={MAX_YEAR}
          onChange={(e) => setYearDraft(e.target.value)}
          onBlur={commitYearDraft}
          onKeyDown={(e) => { if (e.key === "Enter") { commitYearDraft(); e.currentTarget.blur(); } }}
          className="w-24 rounded-md border bg-transparent px-2 py-1 text-center text-lg font-bold tabular-nums"
          style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
          aria-label="表示する年（Enterで確定）"
        />
        <NavButton onClick={() => onYearChange(clampYear(year + 1))} label="1 ›" />
        <NavButton onClick={() => onYearChange(clampYear(year + 10))} label="10 ››" />
        <NavButton onClick={() => onYearChange(today?.year ?? new Date().getFullYear())} label="今年" disabled={isCurrentYear} className="ml-1" suppressHydrationWarning />
        <span className="ml-2 text-[11px]" style={{ color: "var(--text-faint)" }}>{MIN_YEAR}–{MAX_YEAR}</span>
      </nav>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {view.months.map((m) => (
          <MonthCard
            key={m.month}
            month={m}
            weekStart="sun"
            viewTransitionName={`month-${m.month}`}
            onClick={() => onMonthClick(m.month)}
          />
        ))}
      </div>
    </>
  );
}

function NavButton({
  onClick,
  label,
  disabled = false,
  className = "",
  suppressHydrationWarning = false,
}: {
  readonly onClick: () => void;
  readonly label: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly suppressHydrationWarning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      suppressHydrationWarning={suppressHydrationWarning}
      className={`rounded-md border px-2.5 py-1 text-sm font-medium tabular-nums transition-opacity ${disabled ? "cursor-default opacity-40" : "hover:opacity-70"} ${className}`}
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      {label}
    </button>
  );
}
