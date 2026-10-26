"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CivilDate } from "@/domain/shared/date";
import { useEvents } from "@/hooks/useEvents";
import { EventModal } from "@/components/EventModal";
import { useAnnouncer } from "@/hooks/useAnnouncer";

interface EditorState {
  readonly editingId: string | null;
  readonly defaultDate: CivilDate;
}

interface EventEditorValue {
  openCreate(defaultDate: CivilDate): void;
  openEdit(id: string): void;
}

const EventEditorContext = createContext<EventEditorValue | null>(null);

const todayCivil = (): CivilDate => {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
};

export function EventEditorProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { events, addEvent, updateEvent, removeEvent } = useEvents();
  const announce = useAnnouncer();
  const [state, setState] = useState<EditorState | null>(null);

  const openCreate = useCallback((defaultDate: CivilDate) => {
    setState({ editingId: null, defaultDate });
  }, []);
  const openEdit = useCallback((id: string) => {
    setState({ editingId: id, defaultDate: todayCivil() });
  }, []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo<EventEditorValue>(
    () => ({ openCreate, openEdit }),
    [openCreate, openEdit],
  );

  const editing = state?.editingId
    ? (events.find((e) => e.id === state.editingId) ?? null)
    : null;

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
            if (ok) {
              close();
              announce("予定を保存しました");
            }
            return ok;
          }}
          onDelete={
            editing
              ? async () => {
                  const ok = await removeEvent(editing.id);
                  if (ok) {
                    close();
                    announce("予定を削除しました");
                  }
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
  if (!ctx)
    throw new Error("useEventEditor must be used inside EventEditorProvider");
  return ctx;
}
