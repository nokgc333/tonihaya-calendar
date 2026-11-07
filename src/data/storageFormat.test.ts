import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/domain/event";
import {
  MAX_EVENTS,
  MAX_STORED_CHARS,
  STORAGE_VERSION,
  StorageLimitError,
  encodeEvents,
} from "./storageFormat";

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
