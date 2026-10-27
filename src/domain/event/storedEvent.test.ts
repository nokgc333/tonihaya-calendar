import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH, TITLE_MAX_LENGTH, URL_MAX_LENGTH } from "./event";
import { isStoredCalendarEvent, parseStoredEvent } from "./storedEvent";

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

const reason = (v: unknown): string => {
  const r = parseStoredEvent(v);
  if (r.ok) throw new Error("expected a rejection");
  return r.reason;
};

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

describe("parseStoredEvent: what it rejects", () => {
  it.each([
    ["null", null],
    ["a string", "x"],
    ["a number", 42],
    ["an array", []],
  ])("rejects %s", (_name, value) => {
    expect(parseStoredEvent(value).ok).toBe(false);
  });

  it.each([
    ["a missing id", { id: undefined }],
    ["an empty id", { id: "" }],
    ["a numeric id", { id: 1 }],
    ["a numeric title", { title: 1 }],
    ["a text all-day flag", { allDay: "yes" }],
    ["an unknown color", { colorKey: "neon" }],
    ["an unknown priority", { priority: "urgent" }],
    ["a text creation time", { createdAt: "0" }],
    ["an infinite update time", { updatedAt: Infinity }],
    ["a not-a-number creation time", { createdAt: Number.NaN }],
    ["a numeric link", { url: 1 }],
    ["a null link", { url: null }],
    ["an object note", { note: {} }],
  ])("rejects %s", (_name, over) => {
    expect(parseStoredEvent(allDay(over)).ok).toBe(false);
  });

  it.each([
    ["month 13", { year: 2026, month: 13, day: 1 }],
    ["month 0", { year: 2026, month: 0, day: 1 }],
    ["day 0", { year: 2026, month: 7, day: 0 }],
    ["February 30", { year: 2026, month: 2, day: 30 }],
    ["February 29 of a common year", { year: 2026, month: 2, day: 29 }],
    ["April 31", { year: 2026, month: 4, day: 31 }],
    ["a fractional day", { year: 2026, month: 7, day: 1.5 }],
    ["a not-a-number year", { year: Number.NaN, month: 7, day: 1 }],
    ["a text month", { year: 2026, month: "7", day: 1 }],
    ["a year before 1", { year: 0, month: 7, day: 1 }],
    ["a year after 9999", { year: 10000, month: 7, day: 1 }],
  ])("rejects the date %s", (_name, date) => {
    expect(
      parseStoredEvent(allDay({ start: { date }, end: { date } })).ok,
    ).toBe(false);
  });

  it.each([
    ["hour 24", [24, 0]],
    ["hour -1", [-1, 0]],
    ["minute 60", [9, 60]],
    ["a fractional hour", [9.5, 0]],
  ])("rejects the time with %s", (_name, start) => {
    expect(
      parseStoredEvent(timed(start as [number, number], [23, 59])).ok,
    ).toBe(false);
  });

  it("rejects a timed event without times, and a time that is not an object", () => {
    expect(
      parseStoredEvent({
        ...timed([9, 0], [10, 0]),
        start: { date: { year: 2026, month: 7, day: 15 } },
      }).ok,
    ).toBe(false);
    expect(parseStoredEvent(allDay({ start: { date: 1 } })).ok).toBe(false);
    expect(parseStoredEvent(allDay({ start: null })).ok).toBe(false);
  });

  it("rejects an event that ends before it starts, by date and by time", () => {
    expect(
      parseStoredEvent(
        allDay({ end: { date: { year: 2026, month: 7, day: 14 } } }),
      ).ok,
    ).toBe(false);
    expect(parseStoredEvent(timed([10, 0], [9, 0])).ok).toBe(false);
    expect(parseStoredEvent(timed([10, 0], [9, 59])).ok).toBe(false);
    expect(parseStoredEvent(timed([10, 0], [10, 1])).ok).toBe(true);
    expect(parseStoredEvent(timed([10, 0], [10, 0])).ok).toBe(false);
  });

  it("says which part was wrong", () => {
    expect(reason(allDay({ id: "" }))).toContain("id");
    expect(reason(allDay({ colorKey: "neon" }))).toContain("colorKey");
    expect(
      reason(allDay({ start: { date: { year: 2026, month: 2, day: 30 } } })),
    ).toContain("start");
  });
});

describe("parseStoredEvent: what it repairs", () => {
  it("cuts a title that is too long to the limit and says so", () => {
    const r = parseStoredEvent(
      allDay({ title: "あ".repeat(TITLE_MAX_LENGTH + 50) }),
    );
    expect(r.ok && r.event.title).toHaveLength(TITLE_MAX_LENGTH);
    expect(r.ok && r.repaired).toEqual(["title"]);
  });

  it("keeps a title that is exactly at the limit", () => {
    const r = parseStoredEvent(allDay({ title: "a".repeat(TITLE_MAX_LENGTH) }));
    expect(r.ok && r.repaired).toEqual([]);
  });

  it("cuts a note that is too long to the limit", () => {
    const r = parseStoredEvent(
      allDay({ note: "n".repeat(NOTE_MAX_LENGTH + 1) }),
    );
    expect(r.ok && r.event.note).toHaveLength(NOTE_MAX_LENGTH);
    expect(r.ok && r.repaired).toEqual(["note"]);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com/",
    "//example.com/",
    "not a url",
  ])("drops the link %s and keeps the event", (url) => {
    const r = parseStoredEvent(allDay({ url }));
    expect(r.ok && "url" in r.event).toBe(false);
    expect(r.ok && r.repaired).toEqual(["url"]);
  });

  it("drops a link that is too long", () => {
    const r = parseStoredEvent(
      allDay({ url: `https://example.com/${"a".repeat(URL_MAX_LENGTH)}` }),
    );
    expect(r.ok && "url" in r.event).toBe(false);
    expect(r.ok && r.repaired).toEqual(["url"]);
  });

  it("forgets everything it does not know, so that nothing unexpected is carried on", () => {
    const r = parseStoredEvent(
      allDay({ extra: "x", __proto__: { polluted: true }, constructor: "y" }),
    );
    expect(r.ok && Object.keys(r.event).sort()).toEqual(
      [
        "allDay",
        "colorKey",
        "createdAt",
        "end",
        "id",
        "priority",
        "start",
        "title",
        "updatedAt",
      ].sort(),
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("isStoredCalendarEvent", () => {
  it("is true only for an event that needs no repair", () => {
    expect(isStoredCalendarEvent(allDay())).toBe(true);
    expect(isStoredCalendarEvent(allDay({ url: "javascript:alert(1)" }))).toBe(
      false,
    );
    expect(isStoredCalendarEvent(allDay({ id: "" }))).toBe(false);
  });
});
