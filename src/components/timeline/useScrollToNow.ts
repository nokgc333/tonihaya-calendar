import { useEffect, type RefObject } from "react";
import type { CivilDate } from "@/domain/shared/date";
import { initialScrollTop } from "@/components/timeline/timelineLayout";

export function useScrollToNow(
  ref: RefObject<HTMLDivElement | null>,
  todayIndex: number,
  date: CivilDate,
): void {
  const { year, month, day } = date;
  useEffect(() => {
    if (!ref.current || todayIndex < 0) return;
    ref.current.scrollTop = initialScrollTop(new Date());
  }, [ref, todayIndex, year, month, day]);
}
