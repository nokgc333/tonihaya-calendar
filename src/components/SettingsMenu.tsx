"use client";

import { useEffect, useRef, useState } from "react";
import type { WeekStart } from "@/domain/calendar";
import { SegmentButton } from "@/components/SegmentButton";

/** 歯車→設定ポップオーバー。現状は週開始(日/月)のみ。外側クリック/Escで閉じる。 */
export function SettingsMenu({
  weekStart,
  onWeekStartChange,
}: {
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="設定"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="設定"
          className="absolute right-0 z-20 mt-1 rounded-lg border p-3 shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <div className="mb-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            週開始
          </div>
          <div className="flex items-center gap-1">
            <SegmentButton
              label="日"
              active={weekStart === "sun"}
              onClick={() => onWeekStartChange("sun")}
              aria-current={weekStart === "sun" ? "true" : undefined}
            />
            <SegmentButton
              label="月"
              active={weekStart === "mon"}
              onClick={() => onWeekStartChange("mon")}
              aria-current={weekStart === "mon" ? "true" : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
