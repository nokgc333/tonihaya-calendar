"use client";

import type { JumpLevel } from "@/domain/view";
import { SegmentButton } from "@/components/common/SegmentButton";

const LEVELS: readonly { level: JumpLevel; label: string }[] = [
  { level: "overview", label: "年" },
  { level: "month", label: "月" },
  { level: "week", label: "週" },
  { level: "day", label: "日" },
];

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
          <SegmentButton
            key={level}
            label={label}
            active={active}
            onClick={() => onJump(level)}
            disabled={active}
            aria-current={active ? "true" : undefined}
            className={active ? "cursor-default" : ""}
          />
        );
      })}
    </div>
  );
}
