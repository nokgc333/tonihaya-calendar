"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarEvent, EventColorKey, EventDraft, EventPriority } from "@/domain/event";
import {
  isSafeUrl,
  validateEvent,
  NOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  URL_MAX_LENGTH,
} from "@/domain/event";
import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";
import { EVENT_COLOR_KEYS, eventColor } from "@/components/eventColors";

const pad = (n: number): string => String(n).padStart(2, "0");
const toDateInput = (d: CivilDate): string => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
const fromDateInput = (s: string): CivilDate => {
  const [year, month, day] = s.split("-").map(Number);
  return { year, month, day };
};
const toTimeInput = (t: TimeOfDay | undefined, fallback: string): string =>
  t ? `${pad(t.hour)}:${pad(t.minute)}` : fallback;
const fromTimeInput = (s: string): TimeOfDay => {
  const [hour, minute] = s.split(":").map(Number);
  return { hour, minute };
};

const PRIORITIES: readonly { value: EventPriority; label: string }[] = [
  { value: "low", label: "低" },
  { value: "normal", label: "中" },
  { value: "high", label: "高" },
];

const SAVE_ERROR = "保存できませんでした。ブラウザの空き容量やプライベートモードをご確認ください。";
const DELETE_ERROR = "削除できませんでした。ブラウザの空き容量やプライベートモードをご確認ください。";

export function EventModal({
  initial,
  defaultDate,
  onSubmit,
  onDelete,
  onClose,
}: {
  readonly initial: CalendarEvent | null;
  readonly defaultDate: CivilDate;
  readonly onSubmit: (draft: EventDraft) => void | Promise<boolean>;
  readonly onDelete?: () => void | Promise<boolean>;
  readonly onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [allDay, setAllDay] = useState(initial?.allDay ?? true);
  const [startDate, setStartDate] = useState(toDateInput(initial?.start.date ?? defaultDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.end.date ?? defaultDate));
  const [startTime, setStartTime] = useState(toTimeInput(initial?.start.time, "09:00"));
  const [endTime, setEndTime] = useState(toTimeInput(initial?.end.time, "10:00"));
  const [colorKey, setColorKey] = useState<EventColorKey>(initial?.colorKey ?? "blue");
  const [priority, setPriority] = useState<EventPriority>(initial?.priority ?? "normal");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<readonly string[]>([]);

  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const buildDraft = (): EventDraft => ({
    title,
    allDay,
    start: { date: fromDateInput(startDate), time: allDay ? undefined : fromTimeInput(startTime) },
    end: { date: fromDateInput(endDate), time: allDay ? undefined : fromTimeInput(endTime) },
    colorKey,
    priority,
    url: url.trim() ? url.trim() : undefined,
    note: note.trim() ? note.trim() : undefined,
  });

  const handleSubmit = async (): Promise<void> => {
    const draft = buildDraft();
    const errs = validateEvent(draft);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    const ok = await onSubmit(draft);
    if (ok === false) setErrors([SAVE_ERROR]);
  };

  const labelCls = "block text-xs font-medium";
  const inputCls =
    "w-full rounded-md border px-2 py-1.5 text-sm";
  const inputStyle = { borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "予定を編集" : "予定を作成"}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl border p-4 shadow-xl"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{initial ? "予定を編集" : "予定を作成"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-md px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {errors.length > 0 && (
          <ul className="mb-3 space-y-1 rounded-md p-2 text-xs" style={{ background: "var(--sun-bg)", color: "var(--accent-red)" }}>
            {errors.map((e) => (
              <li key={e}>・{e}</li>
            ))}
          </ul>
        )}

        <div className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="ev-title">タイトル</label>
            <input
              id="ev-title"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX_LENGTH}
              className={inputCls}
              style={inputStyle}
              placeholder="例: 打合せ"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            終日
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls} htmlFor="ev-sd">開始日</label>
              <input id="ev-sd" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ev-ed">終了日</label>
              <input id="ev-ed" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls} htmlFor="ev-st">開始時刻</label>
                <input id="ev-st" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ev-et">終了時刻</label>
                <input id="ev-et" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} style={inputStyle} />
              </div>
            </div>
          )}

          <div>
            <span className={labelCls}>色</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {EVENT_COLOR_KEYS.map((k) => {
                const c = eventColor(k);
                const active = k === colorKey;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setColorKey(k)}
                    aria-label={`色 ${k}`}
                    aria-pressed={active}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background: c.bg, borderColor: active ? c.fg : c.border }}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="ev-pri">優先度</label>
            <select id="ev-pri" value={priority} onChange={(e) => setPriority(e.target.value as EventPriority)} className={inputCls} style={inputStyle}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="ev-url">URL</label>
            <input id="ev-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={URL_MAX_LENGTH} className={inputCls} style={inputStyle} placeholder="https://" />
            {isSafeUrl(url.trim()) && (
              <a
                href={url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block max-w-full truncate text-xs underline transition-opacity hover:opacity-70"
                style={{ color: "var(--ev-blue-fg)" }}
              >
                ↗ リンクを開く
              </a>
            )}
          </div>

          <div>
            <label className={labelCls} htmlFor="ev-note">備考</label>
            <textarea id="ev-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX_LENGTH} rows={2} className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {initial && onDelete ? (
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("この予定を削除しますか？")) return;
                const ok = await onDelete();
                if (ok === false) setErrors([DELETE_ERROR]);
              }}
              className="rounded-md px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--accent-red)" }}
            >
              削除
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-md px-3 py-1.5 text-sm font-medium"
              style={{ background: "var(--today-bg)", color: "var(--today-fg)" }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
