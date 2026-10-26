import { useEffect, type RefObject } from "react";
import type { CivilDate } from "@/domain/shared/date";
import { initialScrollTop } from "@/components/weekLayout";

export function useEscapeToBack(onBack: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);
}

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
