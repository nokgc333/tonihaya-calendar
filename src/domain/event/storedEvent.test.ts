import { describe, expect, it } from "vitest";
import { parseStoredEvent } from "./storedEvent";

const allDay = (over: Record<string, unknown> = {}) => ({
  id: "e1",
  title: "Planning",
  allDay: true,
  start: { date: { year: 2026, month: 7, day: 15 } },
  end: { date: { year: 2026, month: 7, day: 15 } },
  colorKey: "blue",
  priority: "normal",
  createdAt: 1,
  updatedAt: 2,
  ...over,
});

const timed = (
  start: [number, number],
  end: [number, number],
  over: Record<string, unknown> = {},
) => ({
  ...allDay(),
  allDay: false,
  start: {
    date: { year: 2026, month: 7, day: 15 },
    time: { hour: start[0], minute: start[1] },
  },
  end: {
    date: { year: 2026, month: 7, day: 15 },
    time: { hour: end[0], minute: end[1] },
  },
  ...over,
});

describe("parseStoredEvent: what it accepts", () => {
  it("returns a valid all-day event unchanged, with nothing repaired", () => {
    const r = parseStoredEvent(allDay());
    expect(r).toEqual({ ok: true, event: allDay(), repaired: [] });
  });

  it("returns a valid timed event unchanged", () => {
    const r = parseStoredEvent(timed([9, 30], [10, 45]));
    expect(r).toEqual({
      ok: true,
      event: timed([9, 30], [10, 45]),
      repaired: [],
    });
  });

  it("accepts a leap day in a leap year and the end of the year", () => {
    const d = (year: number, month: number, day: number) => ({
      date: { year, month, day },
    });
    expect(
      parseStoredEvent(allDay({ start: d(2028, 2, 29), end: d(2028, 2, 29) }))
        .ok,
    ).toBe(true);
    expect(
      parseStoredEvent(allDay({ start: d(2026, 12, 31), end: d(2027, 1, 1) }))
        .ok,
    ).toBe(true);
  });

  it("accepts an event that runs past midnight", () => {
    const e = timed([22, 0], [2, 0], {
      end: {
        date: { year: 2026, month: 7, day: 16 },
        time: { hour: 2, minute: 0 },
      },
    });
    expect(parseStoredEvent(e).ok).toBe(true);
  });

  it("keeps the optional link and note", () => {
    const r = parseStoredEvent(
      allDay({ url: "https://example.com/a?b=1", note: "memo" }),
    );
    expect(r.ok && r.event.url).toBe("https://example.com/a?b=1");
    expect(r.ok && r.event.note).toBe("memo");
  });
});
