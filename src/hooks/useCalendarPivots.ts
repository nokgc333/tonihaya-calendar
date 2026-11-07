"use client";

import { useEffect, useRef, useState } from "react";
import type { ZoomState } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";

export interface WeekOrigin {
  readonly year: number;
  readonly month: number;
}

export function useCalendarPivots(zoom: ZoomState) {
  const [pivotDay, setPivotDay] = useState<CivilDate | null>(null);
  const [jumpPivot, setJumpPivot] = useState<CivilDate | null>(null);
  const justJumpedRef = useRef(false);
  useEffect(() => {
    if (justJumpedRef.current) {
      justJumpedRef.current = false;
      return;
    }
    setJumpPivot(null);
  }, [zoom.level, zoom.year, zoom.month, zoom.day]);
  const [weekOrigin, setWeekOrigin] = useState<WeekOrigin | null>(null);

  const [dayPivot, setDayPivot] = useState<CivilDate | null>(null);
  useEffect(() => {
    if (zoom.level !== "week" && zoom.level !== "day") setDayPivot(null);
  }, [zoom.level]);

  return {
    pivotDay,
    setPivotDay,
    jumpPivot,
    setJumpPivot,
    justJumpedRef,
    weekOrigin,
    setWeekOrigin,
    dayPivot,
    setDayPivot,
  };
}
