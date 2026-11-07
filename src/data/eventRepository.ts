import type { CalendarEvent } from "@/domain/event";

export interface EventRepository {
  list(): Promise<readonly CalendarEvent[]>;
  add(event: CalendarEvent): Promise<void>;
  update(event: CalendarEvent): Promise<void>;
  remove(id: string): Promise<void>;
}
