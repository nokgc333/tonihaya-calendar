"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CalendarEvent, EventDraft } from "@/domain/event";
import { LocalStorageEventRepository } from "@/data/localStorageEventRepository";
import type { EventRepository } from "@/data/eventRepository";

interface EventContextValue {
  readonly events: readonly CalendarEvent[];
  readonly loading: boolean;
  addEvent(draft: EventDraft): Promise<boolean>;
  updateEvent(event: CalendarEvent): Promise<boolean>;
  removeEvent(id: string): Promise<boolean>;
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
        try {
          await repo().add(event);
        } catch {
          return false;
        }
        setEvents((prev) => [...prev, event]);
        return true;
      },
      async updateEvent(event) {
        const updated = { ...event, updatedAt: Date.now() };
        try {
          await repo().update(updated);
        } catch {
          return false;
        }
        setEvents((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e)),
        );
        return true;
      },
      async removeEvent(id) {
        try {
          await repo().remove(id);
        } catch {
          return false;
        }
        setEvents((prev) => prev.filter((e) => e.id !== id));
        return true;
      },
    }),
    [events, loading],
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export function useEvents(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used inside EventProvider");
  return ctx;
}
