import type { RefObject } from "react";
import { TITLE_MAX_LENGTH } from "@/domain/event";
import type { EventFormValues } from "@/components/event/eventForm";
import type { SetFormValue } from "@/components/event/useEventForm";

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
