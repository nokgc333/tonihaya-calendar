"use client";

import type { JumpLevel } from "@/domain/view";

const LEVELS: readonly { level: JumpLevel; label: string }[] = [
  { level: "overview", label: "年" },
  { level: "month", label: "月" },
  { level: "week", label: "週" },
  { level: "day", label: "日" },
];

/** 年/月/週/日を1クリックで切り替えるセグメント。現在レベルはactive＋disabled。
 * 全レベル(L0/L1/L2/L3)で位置・見た目を統一するため、群自体を薄い背景ボックスで囲む。 */
export function LevelSwitcher({
  current,
  onJump,
}: {
  readonly current: JumpLevel;
  readonly onJump: (level: JumpLevel) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-lg border px-1.5 py-1"
      role="group"
      aria-label="表示レベルの切替"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      {LEVELS.map(({ level, label }) => {
        const active = level === current;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onJump(level)}
            disabled={active}
            aria-current={active ? "true" : undefined}
            className={`rounded-md border px-2 py-1 text-xs tabular-nums transition-opacity ${
              active ? "cursor-default font-bold" : "opacity-60 hover:opacity-100"
            }`}
            style={{
              borderColor: active ? "var(--border-strong)" : "var(--border)",
              color: "var(--text)",
              background: active ? "var(--surface)" : "transparent",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
