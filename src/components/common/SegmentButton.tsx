"use client";

import type { ComponentPropsWithoutRef } from "react";

export function SegmentButton({
  label,
  active,
  className = "",
  ...rest
}: {
  readonly label: string;
  readonly active: boolean;
} & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-md border px-2 py-1 text-xs tabular-nums transition-opacity ${
        active
          ? "font-bold"
          : "text-[var(--text-muted)] hover:text-[var(--text)]"
      } ${className}`}
      style={{
        borderColor: active ? "var(--border-strong)" : "var(--border)",
        ...(active ? { color: "var(--text)" } : {}),
        background: active ? "var(--surface)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}
