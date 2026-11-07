import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/domain/event";
import {
  MAX_EVENTS,
  MAX_STORED_CHARS,
  STORAGE_VERSION,
  StorageLimitError,
  decodeEvents,
  encodeEvents,
} from "./storageFormat";

const legacy: CalendarEvent[] = JSON.parse(
  readFileSync(
    join(process.cwd(), "tests/fixtures/legacy-v0-events.json"),
    "utf-8",
  ),
);

const ev = (id: string, over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  title: id,
  allDay: true,
  start: { date: { year: 2026, month: 7, day: 1 } },
  end: { date: { year: 2026, month: 7, day: 1 } },
  colorKey: "blue",
  priority: "normal",
  createdAt: 1,
  updatedAt: 1,
  ...over,
});

describe("encodeEvents", () => {
  it("writes the version and the events", () => {
    expect(JSON.parse(encodeEvents([ev("a")]))).toEqual({
      version: STORAGE_VERSION,
      events: [ev("a")],
    });
  });

  it("refuses more events than the limit, with an error that says what the limit is", () => {
    const many = Array.from({ length: MAX_EVENTS + 1 }, (_, i) => ev(`e${i}`));
    expect(() => encodeEvents(many)).toThrow(StorageLimitError);
    expect(() => encodeEvents(many)).toThrow(String(MAX_EVENTS));
  });

  it("accepts exactly the limit", () => {
    const many = Array.from({ length: MAX_EVENTS }, (_, i) =>
      ev(`e${i}`, { title: "t" }),
    );
    expect(() => encodeEvents(many)).not.toThrow();
  });

  it("refuses a text that is too big, even with few events", () => {
    const big = ev("big", { note: "x".repeat(MAX_STORED_CHARS) });
    expect(() => encodeEvents([big])).toThrow(StorageLimitError);
  });
});

describe("decodeEvents: nothing and current data", () => {
  it.each([null, ""])("reads %j as no events", (raw) => {
    expect(decodeEvents(raw)).toEqual({
      status: "empty",
      events: [],
      rejected: [],
      repaired: 0,
    });
  });

  it("reads what encodeEvents wrote, with nothing rejected or repaired", () => {
    const events = [ev("a"), ev("b", { colorKey: "rose" })];
    const r = decodeEvents(encodeEvents(events));
    expect(r.status).toBe("ok");
    expect(r.events).toEqual(events);
    expect(r.rejected).toEqual([]);
    expect(r.repaired).toBe(0);
  });
});

describe("decodeEvents: the data of the first version, a bare list", () => {
  it("moves every event of a real old file without losing or changing one", () => {
    const r = decodeEvents(JSON.stringify(legacy));
    expect(r.status).toBe("migrated");
    expect(r.events).toEqual(legacy);
    expect(r.rejected).toEqual([]);
    expect(r.events).toHaveLength(12);
  });

  it("keeps the order of the events", () => {
    const shuffled = [...legacy].reverse();
    expect(
      decodeEvents(JSON.stringify(shuffled)).events.map((e) => e.id),
    ).toEqual(shuffled.map((e) => e.id));
  });

  it("reads an empty old list as migrated, not as empty data", () => {
    expect(decodeEvents("[]").status).toBe("migrated");
  });

  it("migrates data that was migrated before once more without a change", () => {
    const first = decodeEvents(JSON.stringify(legacy));
    const second = decodeEvents(encodeEvents(first.events));
    expect(second.events).toEqual(legacy);
  });
});
