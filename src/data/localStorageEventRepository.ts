import type { CalendarEvent } from "@/domain/event";
import type { EventRepository } from "./eventRepository";
import { decodeEvents, encodeEvents, type DecodeResult } from "./storageFormat";

const KEY = "tonihaya.events";
const BACKUP_KEY = `${KEY}.backup`;
const LEGACY_KEY = `${KEY}.legacy-v0`;

export class LocalStorageEventRepository implements EventRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  private read(): CalendarEvent[] {
    try {
      const raw = this.storage.getItem(KEY);
      const result = decodeEvents(raw);
      this.settle(raw, result);
      return result.events;
    } catch {
      return [];
    }
  }

  private settle(raw: string | null, result: DecodeResult): void {
    try {
      this.keepAside(raw, result);
    } catch (err) {
      console.error(`Could not set aside the unusable data (key=${KEY})`, err);
    }
  }

  private keepAside(raw: string | null, result: DecodeResult): void {
    const { status } = result;
    if (status === "corrupt" || status === "too-large" || status === "future") {
      this.moveAway(raw ?? "");
      return;
    }
    if (status === "migrated") this.storage.setItem(LEGACY_KEY, raw ?? "");
    if (status === "migrated") {
      this.storage.setItem(KEY, encodeEvents(result.events));
    }
  }

  private moveAway(raw: string): void {
    this.storage.setItem(BACKUP_KEY, raw);
    this.storage.removeItem(KEY);
  }

  private write(events: readonly CalendarEvent[]): void {
    try {
      this.storage.setItem(KEY, encodeEvents(events));
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
