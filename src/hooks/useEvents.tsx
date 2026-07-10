"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent, EventDraft } from "@/domain/event";
import { LocalStorageEventRepository } from "@/data/localStorageEventRepository";
import type { EventRepository } from "@/data/eventRepository";

interface EventContextValue {
  readonly events: readonly CalendarEvent[];
  readonly loading: boolean;
  addEvent(draft: EventDraft): Promise<void>;
  updateEvent(event: CalendarEvent): Promise<void>;
  removeEvent(id: string): Promise<void>;
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({
  children,
  repository,
}: {
  readonly children: React.ReactNode;
  readonly repository?: EventRepository;
}) {
  const [events, setEvents] = useState<readonly CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  // repository はクライアントでのみ生成（静的化/SSR では window 不在）。
  const repoRef = useRef<EventRepository | null>(repository ?? null);
  const repo = (): EventRepository => {
    if (!repoRef.current) repoRef.current = new LocalStorageEventRepository();
    return repoRef.current;
  };

  useEffect(() => {
    repo()
      .list()
      .then((list) => {
        setEvents(list);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<EventContextValue>(
    () => ({
      events,
      loading,
      async addEvent(draft) {
        const now = Date.now();
        const event: CalendarEvent = {
          ...draft,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        // 永続化に成功したときだけ楽観更新する。失敗時は write 内で開発ログ済みなので、
        // ここでは UI へ反映せず未捕捉の Promise 拒否を防ぐ（保存と表示の整合を保つ）。
        try {
          await repo().add(event);
        } catch {
          return;
        }
        setEvents((prev) => [...prev, event]);
      },
      async updateEvent(event) {
        const updated = { ...event, updatedAt: Date.now() };
        try {
          await repo().update(updated);
        } catch {
          return;
        }
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      },
      async removeEvent(id) {
        try {
          await repo().remove(id);
        } catch {
          return;
        }
        setEvents((prev) => prev.filter((e) => e.id !== id));
      },
    }),
    [events, loading],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents は EventProvider の内側で使用してください");
  return ctx;
}
