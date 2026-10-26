"use client";

import type { CalendarEvent, EventDraft } from "@/domain/event";
import type { CivilDate } from "@/domain/shared/date";
import {
  AllDayField,
  ColorField,
  DateFields,
  NoteField,
  PriorityField,
  TimeFields,
  TitleField,
  UrlField,
} from "@/components/EventFormFields";
import { useEventForm } from "@/components/useEventForm";

function ModalHeader({
  title,
  onClose,
}: {
  readonly title: string;
  readonly onClose: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold">{title}</h2>
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
  );
}

function ErrorList({ errors }: { readonly errors: readonly string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul
      className="mb-3 space-y-1 rounded-md p-2 text-xs"
      style={{ background: "var(--sun-bg)", color: "var(--accent-red)" }}
    >
      {errors.map((e) => (
        <li key={e}>・{e}</li>
      ))}
    </ul>
  );
}

function ModalFooter({
  canDelete,
  onDelete,
  onClose,
  onSubmit,
}: {
  readonly canDelete: boolean;
  readonly onDelete: () => void;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
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
          onClick={onSubmit}
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            background: "var(--today-bg)",
            color: "var(--today-fg)",
          }}
        >
          保存
        </button>
      </div>
    </div>
  );
}

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
  const { values, setValue, errors, titleRef, submit, remove } = useEventForm(
    initial,
    defaultDate,
    { onSubmit, onDelete, onClose },
  );
  const heading = initial ? "予定を編集" : "予定を作成";
  const fields = { values, setValue };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl border p-4 shadow-xl"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader title={heading} onClose={onClose} />
        <ErrorList errors={errors} />
        <div className="space-y-3">
          <TitleField {...fields} inputRef={titleRef} />
          <AllDayField {...fields} />
          <DateFields {...fields} />
          {!values.allDay && <TimeFields {...fields} />}
          <ColorField {...fields} />
          <PriorityField {...fields} />
          <UrlField {...fields} />
          <NoteField {...fields} />
        </div>
        <ModalFooter
          canDelete={Boolean(initial && onDelete)}
          onDelete={remove}
          onClose={onClose}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
