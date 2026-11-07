import type { RefObject } from "react";
import type { EventPriority } from "@/domain/event";
import {
  isSafeUrl,
  NOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  URL_MAX_LENGTH,
} from "@/domain/event";
import { EVENT_COLOR_KEYS, eventColor } from "@/components/event/eventColors";
import type { EventFormValues } from "@/components/event/eventForm";
import type { SetFormValue } from "@/components/event/useEventForm";

const PRIORITIES: readonly { value: EventPriority; label: string }[] = [
  { value: "low", label: "低" },
  { value: "normal", label: "中" },
  { value: "high", label: "高" },
];

const labelCls = "block text-xs font-medium";
const inputCls = "w-full rounded-md border px-2 py-1.5 text-sm";
const inputStyle = {
  borderColor: "var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
};

interface FieldsProps {
  readonly values: EventFormValues;
  readonly setValue: SetFormValue;
}

export function TitleField({
  values,
  setValue,
  inputRef,
}: FieldsProps & { readonly inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    <div>
      <label className={labelCls} htmlFor="ev-title">
        タイトル
      </label>
      <input
        id="ev-title"
        ref={inputRef}
        value={values.title}
        onChange={(e) => setValue("title", e.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        className={inputCls}
        style={inputStyle}
        placeholder="例: 打合せ"
      />
    </div>
  );
}

export function AllDayField({ values, setValue }: FieldsProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={values.allDay}
        onChange={(e) => setValue("allDay", e.target.checked)}
      />
      終日
    </label>
  );
}

export function DateFields({ values, setValue }: FieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className={labelCls} htmlFor="ev-sd">
          開始日
        </label>
        <input
          id="ev-sd"
          type="date"
          value={values.startDate}
          onChange={(e) => setValue("startDate", e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="ev-ed">
          終了日
        </label>
        <input
          id="ev-ed"
          type="date"
          value={values.endDate}
          onChange={(e) => setValue("endDate", e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
      </div>
    </div>
  );
}

export function TimeFields({ values, setValue }: FieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className={labelCls} htmlFor="ev-st">
          開始時刻
        </label>
        <input
          id="ev-st"
          type="time"
          value={values.startTime}
          onChange={(e) => setValue("startTime", e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="ev-et">
          終了時刻
        </label>
        <input
          id="ev-et"
          type="time"
          value={values.endTime}
          onChange={(e) => setValue("endTime", e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
      </div>
    </div>
  );
}

export function ColorField({ values, setValue }: FieldsProps) {
  return (
    <div>
      <span className={labelCls}>色</span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {EVENT_COLOR_KEYS.map((k) => {
          const c = eventColor(k);
          const active = k === values.colorKey;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setValue("colorKey", k)}
              aria-label={`色 ${k}`}
              aria-pressed={active}
              className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c.bg,
                borderColor: active ? c.fg : c.border,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function PriorityField({ values, setValue }: FieldsProps) {
  return (
    <div>
      <label className={labelCls} htmlFor="ev-pri">
        優先度
      </label>
      <select
        id="ev-pri"
        value={values.priority}
        onChange={(e) => setValue("priority", e.target.value as EventPriority)}
        className={inputCls}
        style={inputStyle}
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function UrlField({ values, setValue }: FieldsProps) {
  const trimmed = values.url.trim();
  return (
    <div>
      <label className={labelCls} htmlFor="ev-url">
        URL
      </label>
      <input
        id="ev-url"
        type="url"
        value={values.url}
        onChange={(e) => setValue("url", e.target.value)}
        maxLength={URL_MAX_LENGTH}
        className={inputCls}
        style={inputStyle}
        placeholder="https://"
      />
      {isSafeUrl(trimmed) && (
        <a
          href={trimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block max-w-full truncate text-xs underline transition-opacity hover:opacity-70"
          style={{ color: "var(--ev-blue-fg)" }}
        >
          ↗ リンクを開く
        </a>
      )}
    </div>
  );
}

export function NoteField({ values, setValue }: FieldsProps) {
  return (
    <div>
      <label className={labelCls} htmlFor="ev-note">
        備考
      </label>
      <textarea
        id="ev-note"
        value={values.note}
        onChange={(e) => setValue("note", e.target.value)}
        maxLength={NOTE_MAX_LENGTH}
        rows={2}
        className={inputCls}
        style={inputStyle}
      />
    </div>
  );
}
