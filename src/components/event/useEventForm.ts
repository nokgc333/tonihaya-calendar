import { useEffect, useRef, useState } from "react";
import type { CalendarEvent, EventDraft } from "@/domain/event";
import { validateEvent } from "@/domain/event";
import type { CivilDate } from "@/domain/shared/date";
import {
  buildDraft,
  initialFormValues,
  type EventFormValues,
} from "@/components/event/eventForm";

const SAVE_ERROR =
  "保存できませんでした。ブラウザの空き容量やプライベートモードをご確認ください。";
const DELETE_ERROR =
  "削除できませんでした。ブラウザの空き容量やプライベートモードをご確認ください。";
const DELETE_CONFIRM = "この予定を削除しますか？";

export interface EventFormHandlers {
  readonly onSubmit: (draft: EventDraft) => void | Promise<boolean>;
  readonly onDelete?: () => void | Promise<boolean>;
  readonly onClose: () => void;
}

export type SetFormValue = <K extends keyof EventFormValues>(
  key: K,
  value: EventFormValues[K],
) => void;

export function useEventForm(
  initial: CalendarEvent | null,
  defaultDate: CivilDate,
  { onSubmit, onDelete, onClose }: EventFormHandlers,
) {
  const [values, setValues] = useState(() =>
    initialFormValues(initial, defaultDate),
  );
  const [errors, setErrors] = useState<readonly string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setValue: SetFormValue = (key, value) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = async (): Promise<void> => {
    const draft = buildDraft(values);
    const problems = validateEvent(draft);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    setErrors([]);
    const ok = await onSubmit(draft);
    if (ok === false) setErrors([SAVE_ERROR]);
  };

  const remove = async (): Promise<void> => {
    if (!onDelete || !window.confirm(DELETE_CONFIRM)) return;
    const ok = await onDelete();
    if (ok === false) setErrors([DELETE_ERROR]);
  };

  return { values, setValue, errors, titleRef, submit, remove };
}
