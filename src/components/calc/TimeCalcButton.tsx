"use client";

import { lazy, Suspense, useCallback, useRef, useState } from "react";

const TimeCalcDialog = lazy(() => import("@/components/calc/TimeCalcDialog"));

export function TimeCalcButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="時間計算を開く"
        className="rounded-md border px-2.5 py-1 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
      >
        計算
      </button>
      {open ? (
        <Suspense fallback={null}>
          <TimeCalcDialog onClose={close} />
        </Suspense>
      ) : null}
    </>
  );
}
