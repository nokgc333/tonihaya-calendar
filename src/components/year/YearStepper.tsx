"use client";

import { useEffect, useState } from "react";
import { MAX_YEAR, MIN_YEAR, clampYear, resolveYearInput } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import { NavButton } from "@/components/year/OverviewControls";

const BIG_STEP = 10;

export function YearStepper({
  year,
  today,
  onYearChange,
}: {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly onYearChange: (year: number) => void;
}) {
  const [yearDraft, setYearDraft] = useState<string>(String(year));
  useEffect(() => setYearDraft(String(year)), [year]);

  const isCurrentYear = today !== null && year === today.year;
  const commitYearDraft = (): void =>
    onYearChange(resolveYearInput(yearDraft, year));

  return (
    <>
      <NavButton
        onClick={() => onYearChange(clampYear(year - BIG_STEP))}
        label="‹‹ 10"
      />
      <NavButton
        onClick={() => onYearChange(clampYear(year - 1))}
        label="‹ 1"
      />
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
      <NavButton
        onClick={() => onYearChange(clampYear(year + 1))}
        label="1 ›"
      />
      <NavButton
        onClick={() => onYearChange(clampYear(year + BIG_STEP))}
        label="10 ››"
      />
      <NavButton
        onClick={() => onYearChange(today?.year ?? new Date().getFullYear())}
        label="今年"
        disabled={isCurrentYear}
        className="ml-1"
        suppressHydrationWarning
      />
      <span className="ml-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
        {MIN_YEAR}–{MAX_YEAR}
      </span>
    </>
  );
}
