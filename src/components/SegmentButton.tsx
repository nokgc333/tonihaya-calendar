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
        active ? "font-bold" : "opacity-60 hover:opacity-100"
      } ${className}`}
      style={{
        borderColor: active ? "var(--border-strong)" : "var(--border)",
        color: "var(--text)",
        background: active ? "var(--surface)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}
