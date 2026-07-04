"use client";

import { useEffect, useState } from "react";
import { getCountdowns, type Countdown } from "@/domain/countdown";
import { clampYear } from "@/domain/view";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody } from "@/components/OverviewBody";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function CalendarApp() {
  const [today, setToday] = useState<CivilDate | null>(null);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());

  useEffect(() => {
    const now = new Date();
    const t: CivilDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    setToday(t);
    setYear(clampYear(t.year));
  }, []);

  const countdowns: Countdown | null = today
    ? getCountdowns(today.year, today.month, today.day)
    : null;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5">
      <TodayHeader today={today} countdowns={countdowns} />
      <OverviewBody
        year={year}
        today={today}
        onYearChange={(y) => setYear(clampYear(y))}
        onMonthClick={() => { /* Task 5 で接続 */ }}
      />
    </main>
  );
}
