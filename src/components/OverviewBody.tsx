"use client";

import { MAX_YEAR, MIN_YEAR, buildYearView, clampYear, resolveYearInput } from "@/domain/view";
import type { JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { SegmentButton } from "@/components/SegmentButton";
import { MonthCard } from "@/components/MonthCard";
import { SettingsMenu } from "@/components/SettingsMenu";
import { useEvents } from "@/hooks/useEvents";
import { AddEventButton } from "@/components/AddEventButton";
import { HolidayList } from "@/components/HolidayList";
import { useEffect, useState } from "react";

/** 俯瞰カレンダーの表示レイアウト（3行×4列 / 4行×3列） */
export type OverviewLayout = "3x4" | "4x3";


export function OverviewBody({
  year,
  today,
  layout,
  onYearChange,
  onMonthClick,
  onLayoutChange,
  onJump,
  weekStart,
  onWeekStartChange,
  jumpPivot,
}: {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly layout: OverviewLayout;
  readonly onYearChange: (year: number) => void;
  readonly onMonthClick: (month: number) => void;
  readonly onLayoutChange: (layout: OverviewLayout) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}) {
  const [yearDraft, setYearDraft] = useState<string>(String(year));
  useEffect(() => setYearDraft(String(year)), [year]);

  const view = buildYearView(year, today, { weekStart });
  const isCurrentYear = today !== null && year === today.year;
  const { events } = useEvents();

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

        {/* 右クラスタ: レイアウト切替（≥1288pxのみ）＋レベル切替（常時・右端）。
            レベル切替はL1/L2/L3でも右端にあるため、L0でも右端に置いて位置を統一する
            （レイアウト切替をその左に）。レベル切替のボックスは LevelSwitcher 自体が持つ。 */}
        <div className="ml-auto flex items-center gap-3">
          <div
            className="hidden items-center gap-1 rounded-lg border px-2 py-1 min-[1288px]:flex"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <span className="mr-1 text-[11px]" style={{ color: "var(--text-muted)" }}>表示</span>
            <LayoutButton label="3×4" active={layout === "3x4"} onClick={() => onLayoutChange("3x4")} />
            <LayoutButton label="4×3" active={layout === "4x3"} onClick={() => onLayoutChange("4x3")} />
          </div>
          <AddEventButton date={isCurrentYear && today ? today : { year, month: 1, day: 1 }} />
          <LevelSwitcher current="overview" onJump={onJump} />
          <SettingsMenu weekStart={weekStart} onWeekStartChange={onWeekStartChange} />
        </div>
      </nav>

      {/* ≥1600px では [グリッド固定1256px] + [祝日一覧] の横並び。
          未満ではグリッドが幅いっぱいを使い（従来どおり列数を可変で折り返し）、祝日一覧は非表示。 */}
      <div className="flex gap-6">
        <div className="w-full min-[1600px]:w-[1256px] min-[1600px]:shrink-0">
          {/* カードは305×242pxで固定。幅に応じて折り返し、余りは中央寄せの余白にする。
              4×3選択かつ≥1288pxではzoomで拡大し3列に。 */}
          <div className="flex flex-wrap justify-center gap-3">
            {view.months.map((m) => (
              <div key={m.month} className={`w-[305px] ${zoomClass}`}>
                <MonthCard
                  month={m}
                  year={year}
                  weekStart={weekStart}
                  viewTransitionName={jumpPivot ? undefined : `month-${m.month}`}
                  jumpDay={jumpPivot}
                  events={events}
                  onClick={() => onMonthClick(m.month)}
                />
              </div>
            ))}
          </div>
        </div>
        {/* ≥1600px: 右サイドに祝日一覧（縦1列）。<1600px は非表示。 */}
        <aside className="hidden min-w-[280px] flex-1 min-[1600px]:block">
          <HolidayList year={year} today={today} onMonthClick={onMonthClick} />
        </aside>
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
  return <SegmentButton label={label} active={active} onClick={onClick} aria-pressed={active} />;
}
