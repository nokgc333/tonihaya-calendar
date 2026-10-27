"use client";

import { useEventEditor } from "@/hooks/useEventEditor";
import type { CivilDate } from "@/domain/shared/date";

export function AddEventButton({ date }: { readonly date: CivilDate }) {
  const { openCreate } = useEventEditor();
  return (
    <button
      type="button"
      onClick={() => openCreate(date)}
      className="rounded-md border px-2.5 py-1 text-sm font-medium transition-opacity hover:opacity-70"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
      aria-label="予定を作成"
    >
      ＋予定
    </button>
  );
}
