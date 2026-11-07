import { type CalendarEvent } from "@/domain/event";

export const STORAGE_VERSION = 1;
export const MAX_EVENTS = 5000;
export const MAX_STORED_CHARS = 2_000_000;

export class StorageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageLimitError";
  }
}

export function encodeEvents(events: readonly CalendarEvent[]): string {
  if (events.length > MAX_EVENTS) {
    throw new StorageLimitError(
      `Cannot store ${events.length} events: the limit is ${MAX_EVENTS}`,
    );
  }
  const text = JSON.stringify({ version: STORAGE_VERSION, events });
  if (text.length > MAX_STORED_CHARS) {
    throw new StorageLimitError(
      `Cannot store ${text.length} characters: the limit is ${MAX_STORED_CHARS}`,
    );
  }
  return text;
}
