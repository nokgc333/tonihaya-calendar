import type { CalendarEvent } from "@/domain/event";
import type { EventRepository } from "./eventRepository";
import {
  decodeEvents,
  encodeEvents,
  type DecodeResult,
  type RejectedEntry,
} from "./storageFormat";

const KEY = "tonihaya.events";
const BACKUP_KEY = `${KEY}.backup`;
const LEGACY_KEY = `${KEY}.legacy-v0`;
const REJECTED_KEY = `${KEY}.rejected`;
const MAX_REJECTED = 100;

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
    const needsRewrite =
      status === "migrated" ||
      result.rejected.length > 0 ||
      result.repaired > 0;
    if (!needsRewrite) return;
    this.setAside(result.rejected);
    this.storage.setItem(KEY, encodeEvents(result.events));
  }

  private moveAway(raw: string): void {
    this.storage.setItem(BACKUP_KEY, raw);
    this.storage.removeItem(KEY);
  }

  private setAside(rejected: readonly RejectedEntry[]): void {
    if (rejected.length === 0) return;
    const before = this.readAside();
    const all = [...before, ...rejected].slice(-MAX_REJECTED);
    this.storage.setItem(REJECTED_KEY, JSON.stringify(all));
  }

  private readAside(): RejectedEntry[] {
    try {
      const parsed = JSON.parse(this.storage.getItem(REJECTED_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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
