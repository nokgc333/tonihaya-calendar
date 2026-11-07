import { parseStoredEvent, type CalendarEvent } from "@/domain/event";

export const STORAGE_VERSION = 1;
export const MAX_EVENTS = 5000;
export const MAX_STORED_CHARS = 2_000_000;

export type DecodeStatus =
  "empty" | "ok" | "migrated" | "corrupt" | "too-large" | "future";

export interface RejectedEntry {
  readonly value: unknown;
  readonly reason: string;
}

export interface DecodeResult {
  readonly status: DecodeStatus;
  readonly events: CalendarEvent[];
  readonly rejected: RejectedEntry[];
  readonly repaired: number;
}

export class StorageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageLimitError";
  }
}

const FIRST_VERSION = 0;

const MIGRATIONS: Readonly<Record<number, (data: unknown) => unknown>> = {
  [FIRST_VERSION]: (data) => ({ version: 1, events: data }),
};

const none = (status: DecodeStatus): DecodeResult => ({
  status,
  events: [],
  rejected: [],
  repaired: 0,
});

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

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

function isVersion(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= FIRST_VERSION;
}

function migrate(
  parsed: unknown,
): { version: number; events: unknown[]; migrated: boolean } | null {
  if (Array.isArray(parsed)) {
    const step = MIGRATIONS[FIRST_VERSION](parsed) as { events: unknown[] };
    return { version: STORAGE_VERSION, events: step.events, migrated: true };
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { version, events } = parsed as { version?: unknown; events?: unknown };
  if (!isVersion(version) || !Array.isArray(events)) return null;
  return { version, events, migrated: false };
}

function readEntries(entries: unknown[]): Omit<DecodeResult, "status"> {
  const events: CalendarEvent[] = [];
  const rejected: RejectedEntry[] = [];
  const seen = new Set<string>();
  let repaired = 0;
  for (const value of entries) {
    const parsed = parseStoredEvent(value);
    if (!parsed.ok) {
      rejected.push({ value, reason: parsed.reason });
    } else if (seen.has(parsed.event.id)) {
      rejected.push({ value, reason: `duplicate id ${parsed.event.id}` });
    } else if (events.length >= MAX_EVENTS) {
      rejected.push({
        value,
        reason: `over the limit of ${MAX_EVENTS} events`,
      });
    } else {
      seen.add(parsed.event.id);
      events.push(parsed.event);
      if (parsed.repaired.length > 0) repaired += 1;
    }
  }
  return { events, rejected, repaired };
}

export function decodeEvents(raw: string | null): DecodeResult {
  if (raw === null || raw === "") return none("empty");
  if (typeof raw !== "string") return none("corrupt");
  if (raw.length > MAX_STORED_CHARS) return none("too-large");
  const json = parseJson(raw);
  if (!json.ok) return none("corrupt");
  const data = migrate(json.value);
  if (data === null) return none("corrupt");
  if (data.version > STORAGE_VERSION) return none("future");
  return {
    status: data.migrated ? "migrated" : "ok",
    ...readEntries(data.events),
  };
}
