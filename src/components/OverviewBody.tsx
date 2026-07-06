"use client";

import { MAX_YEAR, MIN_YEAR, buildYearView, clampYear, resolveYearInput } from "@/domain/view";
import type { JumpLevel } from "@/domain/view";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { MonthCard } from "@/components/MonthCard";
import { useEffect, useState } from "react";

/** 俯瞰カレンダーの表示レイアウト（3行×4列 / 4行×3列） */
export type OverviewLayout = "3x4" | "4x3";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function OverviewBody({
  year,
  today,
  layout,
  onYearChange,
  onMonthClick,
  onLayoutChange,
  onJump,
}: {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly layout: OverviewLayout;
  readonly onYearChange: (year: number) => void;
  readonly onMonthClick: (month: number) => void;
  readonly onLayoutChange: (layout: OverviewLayout) => void;
  readonly onJump: (level: JumpLevel) => void;
}) {
  const [yearDraft, setYearDraft] = useState<string>(String(year));
  useEffect(() => setYearDraft(String(year)), [year]);

  const view = buildYearView(year, today, { weekStart: "sun" });
  const isCurrentYear = today !== null && year === today.year;

  const commitYearDraft = (): void => onYearChange(resolveYearInput(yearDraft, year));

  // 4行×3列のときは ≥1288px でのみカードを拡大し、3列で幅いっぱいを埋める（縦横比保持）。
  const zoomClass = layout === "4x3" ? "min-[1288px]:[zoom:1.34]" : "";

  return (
    <>
      <nav className="mb-5 flex min-h-10 flex-wrap items-center gap-1.5">
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

        {/* 右クラスタ: レベル切替（常時）＋レイアウト切替（≥1288pxのみ） */}
        <div className="ml-auto flex items-center gap-2">
          <LevelSwitcher current="overview" onJump={onJump} />
          <div className="hidden items-center gap-1 min-[1288px]:flex">
            <span className="mr-1 text-[11px]" style={{ color: "var(--text-muted)" }}>表示</span>
            <LayoutButton label="3×4" active={layout === "3x4"} onClick={() => onLayoutChange("3x4")} />
            <LayoutButton label="4×3" active={layout === "4x3"} onClick={() => onLayoutChange("4x3")} />
          </div>
        </div>
      </nav>

      {/* カードは305×242pxで固定。幅に応じて折り返し、余りは中央寄せの余白にする。
          4×3選択かつ≥1288pxではzoomで拡大し3列に。 */}
      <div className="flex flex-wrap justify-center gap-3">
        {view.months.map((m) => (
          <div key={m.month} className={`w-[305px] ${zoomClass}`}>
            <MonthCard
              month={m}
              weekStart="sun"
              viewTransitionName={`month-${m.month}`}
              onClick={() => onMonthClick(m.month)}
            />
          </div>
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

function LayoutButton({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-2 py-1 text-xs tabular-nums transition-opacity ${active ? "font-bold" : "opacity-60 hover:opacity-100"}`}
      style={{
        borderColor: active ? "var(--border-strong)" : "var(--border)",
        color: "var(--text)",
        background: active ? "var(--surface)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}
