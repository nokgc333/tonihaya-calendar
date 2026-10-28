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
  // The day pivot only lives on the week and the day levels; drop it as soon as the zoom leaves
  // them (adjusting state while rendering, so no stale pivot is ever painted).
  if (dayPivot !== null && zoom.level !== "week" && zoom.level !== "day") {
    setDayPivot(null);
  }

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
