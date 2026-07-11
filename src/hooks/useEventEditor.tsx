"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CivilDate } from "@/domain/shared/date";
import { useEvents } from "@/hooks/useEvents";
import { EventModal } from "@/components/EventModal";

interface EditorState {
  readonly editingId: string | null; // null=新規, string=編集
  readonly defaultDate: CivilDate;
}

interface EventEditorValue {
  /** 新規作成モーダルを開く（省略時は今日/表示日を既定に）。 */
  openCreate(defaultDate: CivilDate): void;
  /** 既存イベントを編集で開く。 */
  openEdit(id: string): void;
}

const EventEditorContext = createContext<EventEditorValue | null>(null);

const todayCivil = (): CivilDate => {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
};

export function EventEditorProvider({ children }: { readonly children: React.ReactNode }) {
  const { events, addEvent, updateEvent, removeEvent } = useEvents();
  const [state, setState] = useState<EditorState | null>(null);

  const openCreate = useCallback((defaultDate: CivilDate) => {
    setState({ editingId: null, defaultDate });
  }, []);
  const openEdit = useCallback((id: string) => {
    setState({ editingId: id, defaultDate: todayCivil() });
  }, []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo<EventEditorValue>(() => ({ openCreate, openEdit }), [openCreate, openEdit]);

  const editing = state?.editingId ? (events.find((e) => e.id === state.editingId) ?? null) : null;

  return (
    <EventEditorContext.Provider value={value}>
      {children}
      {state && (
        <EventModal
          initial={editing}
          defaultDate={state.defaultDate}
          onSubmit={async (draft) => {
            const ok = editing
              ? await updateEvent({ ...editing, ...draft })
              : await addEvent(draft);
            if (ok) close();
            return ok;
          }}
          onDelete={
            editing
              ? async () => {
                  const ok = await removeEvent(editing.id);
                  if (ok) close();
                  return ok;
                }
              : undefined
          }
          onClose={close}
        />
      )}
    </EventEditorContext.Provider>
  );
}

export function useEventEditor(): EventEditorValue {
  const ctx = useContext(EventEditorContext);
  if (!ctx) throw new Error("useEventEditor は EventEditorProvider の内側で使用してください");
  return ctx;
}
