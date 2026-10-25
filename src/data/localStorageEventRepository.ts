import { isStoredCalendarEvent } from "@/domain/event";
import type { CalendarEvent } from "@/domain/event";
import type { EventRepository } from "./eventRepository";

const KEY = "tonihaya.events";

export class LocalStorageEventRepository implements EventRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  private read(): CalendarEvent[] {
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isStoredCalendarEvent) : [];
    } catch {
      return [];
    }
  }

  private write(events: readonly CalendarEvent[]): void {
    try {
      this.storage.setItem(KEY, JSON.stringify(events));
    } catch (err) {
      console.error(`Failed to persist events (key=${KEY})`, err);
      throw err;
    }
  }

  async list(): Promise<readonly CalendarEvent[]> {
    return this.read();
  }

  async add(event: CalendarEvent): Promise<void> {
    this.write([...this.read(), event]);
  }

  async update(event: CalendarEvent): Promise<void> {
    this.write(this.read().map((e) => (e.id === event.id ? event : e)));
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((e) => e.id !== id));
  }
}
