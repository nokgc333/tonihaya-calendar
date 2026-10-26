import type { ReactElement } from "react";
import { act, render, type RenderResult } from "@testing-library/react";
import { EventProvider } from "@/hooks/useEvents";
import { EventEditorProvider } from "@/hooks/useEventEditor";
import type { EventRepository } from "@/data/eventRepository";
import type { CalendarEvent } from "@/domain/event";

export class MemoryRepository implements EventRepository {
  store: CalendarEvent[];
  constructor(seed: readonly CalendarEvent[] = []) {
    this.store = [...seed];
  }
  async list() {
    return [...this.store];
  }
  async add(event: CalendarEvent) {
    this.store.push(event);
  }
  async update(event: CalendarEvent) {
    this.store = this.store.map((e) => (e.id === event.id ? event : e));
  }
  async remove(id: string) {
    this.store = this.store.filter((e) => e.id !== id);
  }
}

type Point = readonly [year: number, month: number, day: number, hour?: number];

const toPoint = ([year, month, day, hour]: Point) => ({
  date: { year, month, day },
  ...(hour === undefined ? {} : { time: { hour, minute: 0 } }),
});

export function makeEvent(
  id: string,
  start: Point,
  end: Point,
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    id,
    title: id,
    allDay: start[3] === undefined,
    start: toPoint(start),
    end: toPoint(end),
    colorKey: "blue",
    priority: "normal",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

export async function renderInApp(
  ui: ReactElement,
  events: readonly CalendarEvent[] = [],
  repository: EventRepository = new MemoryRepository(events),
): Promise<RenderResult> {
  const result = render(
    <EventProvider repository={repository}>
      <EventEditorProvider>{ui}</EventEditorProvider>
    </EventProvider>,
  );
  await act(async () => {});
  return result;
}
