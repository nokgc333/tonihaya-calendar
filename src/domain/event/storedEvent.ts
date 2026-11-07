import type { CalendarEvent } from "./types";

export type StoredParse =
  | {
      readonly ok: true;
      readonly event: CalendarEvent;
      readonly repaired: readonly string[];
    }
  | { readonly ok: false; readonly reason: string };

export function parseStoredEvent(v: unknown): StoredParse {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return { ok: false, reason: "the event is not valid" };
  }
  return { ok: true, event: v as CalendarEvent, repaired: [] };
}
