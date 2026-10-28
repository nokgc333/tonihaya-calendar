"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { parseZoom, zoomToQuery, type ZoomState } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";

type HistoryMode = "push" | "replace" | "none";

function withTransition(commit: () => void): void {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canVT =
    typeof document !== "undefined" && "startViewTransition" in document;
  if (canVT && !reduce) {
    (
      document as unknown as { startViewTransition: (cb: () => void) => void }
    ).startViewTransition(() => flushSync(commit));
  } else {
    commit();
  }
}

export function useZoomState() {
  const [today, setToday] = useState<CivilDate | null>(null);
  const [zoom, setZoom] = useState<ZoomState>(() => ({
    level: "overview",
    year: new Date().getFullYear(),
  }));
  const fallbackYearRef = useRef<number>(new Date().getFullYear());

  useEffect(() => {
    const now = new Date();
    const t: CivilDate = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock and the URL exist only in the browser; the statically exported HTML renders without them
    setToday(t);
    fallbackYearRef.current = t.year;
    setZoom(parseZoom(new URLSearchParams(window.location.search), t.year));
  }, []);

  useEffect(() => {
    const onPop = (): void => {
      const next = parseZoom(
        new URLSearchParams(window.location.search),
        fallbackYearRef.current,
      );
      withTransition(() => setZoom(next));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next: ZoomState, mode: HistoryMode): void => {
    withTransition(() => {
      setZoom(next);
      const url = zoomToQuery(next);
      if (mode === "push") window.history.pushState({}, "", url);
      else if (mode === "replace") window.history.replaceState({}, "", url);
    });
  }, []);

  return { zoom, today, navigate };
}
