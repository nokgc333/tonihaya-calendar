import { describe, expect, it } from "vitest";
import {
  clipEventToDay,
  eventsForDay,
  isSafeUrl,
  layoutDayColumns,
  minutesOfDay,
  sortForDay,
  validateEvent,
  NOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  URL_MAX_LENGTH,
  type DaySegment,
} from "./event";
import { isStoredCalendarEvent } from "./storedEvent";
import type { CalendarEvent } from "./types";

const base = {
  colorKey: "blue",
  priority: "normal",
  createdAt: 0,
  updatedAt: 0,
} as const;
const allDay = (
  id: string,
  s: [number, number, number],
  e: [number, number, number],
): CalendarEvent => ({
  ...base,
  id,
  title: id,
  allDay: true,
  start: { date: { year: s[0], month: s[1], day: s[2] } },
  end: { date: { year: e[0], month: e[1], day: e[2] } },
});
const timed = (
  id: string,
  d: [number, number, number],
  sh: number,
  eh: number,
): CalendarEvent => ({
  ...base,
  id,
  title: id,
  allDay: false,
  start: {
    date: { year: d[0], month: d[1], day: d[2] },
    time: { hour: sh, minute: 0 },
  },
  end: {
    date: { year: d[0], month: d[1], day: d[2] },
    time: { hour: eh, minute: 0 },
  },
});

describe("minutesOfDay", () => {
  it("converts a time to minutes within the day", () => {
    expect(minutesOfDay({ hour: 9, minute: 30 })).toBe(570);
  });
});

describe("eventsForDay", () => {
  it("returns events whose range includes the day (including the middle days of a multi-day event)", () => {
    const trip = allDay("trip", [2026, 7, 10], [2026, 7, 15]);
    const other = allDay("x", [2026, 7, 20], [2026, 7, 20]);
    const got = eventsForDay([trip, other], { year: 2026, month: 7, day: 12 });
    expect(got.map((e) => e.id)).toEqual(["trip"]);
  });
});

describe("clipEventToDay", () => {
  const multi: CalendarEvent = {
    ...base,
    id: "m",
    title: "m",
    allDay: false,
    start: {
      date: { year: 2026, month: 7, day: 10 },
      time: { hour: 23, minute: 0 },
    },
    end: {
      date: { year: 2026, month: 7, day: 12 },
      time: { hour: 2, minute: 0 },
    },
  };
  it("the first day runs from the start time to 24:00 and continues to the next day", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 10 })!;
    expect([
      s.startMin,
      s.endMin,
      s.continuesFromPrev,
      s.continuesToNext,
    ]).toEqual([1380, 1440, false, true]);
  });
  it("a middle day runs from 0:00 to 24:00 and continues in both directions", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 11 })!;
    expect([
      s.startMin,
      s.endMin,
      s.continuesFromPrev,
      s.continuesToNext,
    ]).toEqual([0, 1440, true, true]);
  });
  it("the last day runs from 0:00 to the end time and continues from the previous day", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 12 })!;
    expect([
      s.startMin,
      s.endMin,
      s.continuesFromPrev,
      s.continuesToNext,
    ]).toEqual([0, 120, true, false]);
  });
  it("an all-day event returns null", () => {
    expect(
      clipEventToDay(allDay("a", [2026, 7, 12], [2026, 7, 12]), {
        year: 2026,
        month: 7,
        day: 12,
      }),
    ).toBeNull();
  });
  it("a day outside the range returns null", () => {
    expect(clipEventToDay(multi, { year: 2026, month: 7, day: 13 })).toBeNull();
  });
});

describe("layoutDayColumns", () => {
  const seg = (id: string, startMin: number, endMin: number): DaySegment => ({
    event: {
      ...base,
      id,
      title: id,
      allDay: false,
      start: {
        date: { year: 2026, month: 7, day: 12 },
        time: { hour: 0, minute: 0 },
      },
      end: {
        date: { year: 2026, month: 7, day: 12 },
        time: { hour: 1, minute: 0 },
      },
    },
    startMin,
    endMin,
    continuesFromPrev: false,
    continuesToNext: false,
  });
  it("non-overlapping events use 1 column", () => {
    const out = layoutDayColumns([seg("a", 0, 60), seg("b", 120, 180)]);
    expect(out.every((s) => s.columnCount === 1 && s.columnIndex === 0)).toBe(
      true,
    );
  });
  it("two overlapping events are assigned 2 columns", () => {
    const out = layoutDayColumns([seg("a", 0, 120), seg("b", 60, 180)]);
    const a = out.find((s) => s.event.id === "a")!;
    const b = out.find((s) => s.event.id === "b")!;
    expect(a.columnCount).toBe(2);
    expect(b.columnCount).toBe(2);
    expect(new Set([a.columnIndex, b.columnIndex])).toEqual(new Set([0, 1]));
  });
  it("non-overlapping events are not put in the same cluster (1 column)", () => {
    const out = layoutDayColumns([
      seg("a", 0, 60),
      seg("b", 30, 90),
      seg("c", 200, 260),
    ]);
    expect(out.find((s) => s.event.id === "c")!.columnCount).toBe(1);
    expect(out.find((s) => s.event.id === "a")!.columnCount).toBe(2);
  });
});

describe("isSafeUrl", () => {
  it("allows http/https and rejects everything else", () => {
    expect(isSafeUrl("https://a.com")).toBe(true);
    expect(isSafeUrl("http://a.com")).toBe(true);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("not a url")).toBe(false);
  });
});

describe("validateEvent", () => {
  const okTimed = {
    title: "x",
    allDay: false,
    colorKey: "blue",
    priority: "normal",
    start: {
      date: { year: 2026, month: 7, day: 12 },
      time: { hour: 9, minute: 0 },
    },
    end: {
      date: { year: 2026, month: 7, day: 12 },
      time: { hour: 10, minute: 0 },
    },
  } as const;
  it("a valid timed event has no errors", () => {
    expect(validateEvent(okTimed)).toEqual([]);
  });
  it("an empty title is an error", () => {
    expect(validateEvent({ ...okTimed, title: "  " }).length).toBeGreaterThan(
      0,
    );
  });
  it("end <= start on the same day is an error", () => {
    expect(
      validateEvent({
        ...okTimed,
        end: {
          date: { year: 2026, month: 7, day: 12 },
          time: { hour: 9, minute: 0 },
        },
      }).length,
    ).toBeGreaterThan(0);
  });
  it("end date < start date is an error", () => {
    expect(
      validateEvent({
        ...okTimed,
        end: {
          date: { year: 2026, month: 7, day: 11 },
          time: { hour: 10, minute: 0 },
        },
      }).length,
    ).toBeGreaterThan(0);
  });
  it("an invalid URL is an error", () => {
    expect(
      validateEvent({ ...okTimed, url: "javascript:alert(1)" }).length,
    ).toBeGreaterThan(0);
  });
  it("a multi-day all-day event is valid", () => {
    expect(
      validateEvent({
        title: "trip",
        allDay: true,
        colorKey: "green",
        priority: "normal",
        start: { date: { year: 2026, month: 7, day: 10 } },
        end: { date: { year: 2026, month: 7, day: 15 } },
      }),
    ).toEqual([]);
  });
  it("a title over the limit is an error", () => {
    expect(
      validateEvent({ ...okTimed, title: "a".repeat(TITLE_MAX_LENGTH + 1) })
        .length,
    ).toBeGreaterThan(0);
  });
  it("a title exactly at the limit is valid", () => {
    expect(
      validateEvent({ ...okTimed, title: "a".repeat(TITLE_MAX_LENGTH) }),
    ).toEqual([]);
  });
  it("notes over the limit are an error", () => {
    expect(
      validateEvent({ ...okTimed, note: "n".repeat(NOTE_MAX_LENGTH + 1) })
        .length,
    ).toBeGreaterThan(0);
  });
  it("a URL over the limit is an error", () => {
    const longUrl = "https://example.com/" + "a".repeat(URL_MAX_LENGTH);
    expect(validateEvent({ ...okTimed, url: longUrl }).length).toBeGreaterThan(
      0,
    );
  });
});

describe("validateEvent in detail", () => {
  const draft = {
    title: "x",
    allDay: false,
    colorKey: "blue",
    priority: "normal",
    start: {
      date: { year: 2026, month: 7, day: 12 },
      time: { hour: 9, minute: 0 },
    },
    end: {
      date: { year: 2026, month: 7, day: 12 },
      time: { hour: 10, minute: 0 },
    },
  } as const;

  it("treats a title of only spaces as empty", () => {
    expect(validateEvent({ ...draft, title: "   " })).toEqual([
      "タイトルを入力してください",
    ]);
  });

  it("accepts notes exactly at the limit and an empty note", () => {
    expect(
      validateEvent({ ...draft, note: "n".repeat(NOTE_MAX_LENGTH) }),
    ).toEqual([]);
    expect(validateEvent({ ...draft, note: "" })).toEqual([]);
  });

  it("accepts a safe URL exactly at the limit", () => {
    const url = "https://example.com/" + "a".repeat(URL_MAX_LENGTH - 20);
    expect(url.length).toBe(URL_MAX_LENGTH);
    expect(validateEvent({ ...draft, url })).toEqual([]);
  });

  it("reports a too long but otherwise safe URL once", () => {
    const url = "https://example.com/" + "a".repeat(URL_MAX_LENGTH);
    expect(validateEvent({ ...draft, url })).toEqual([
      `URLは${URL_MAX_LENGTH}文字以内にしてください`,
    ]);
  });

  it("asks for both times when a timed event has none", () => {
    expect(
      validateEvent({
        ...draft,
        start: { date: draft.start.date },
        end: { date: draft.end.date },
      }),
    ).toEqual(["時間イベントは開始・終了時刻が必要です"]);
  });

  it("asks for both times when only one of them is missing", () => {
    expect(validateEvent({ ...draft, end: { date: draft.end.date } })).toEqual([
      "時間イベントは開始・終了時刻が必要です",
    ]);
  });

  it("does not compare times across different days", () => {
    expect(
      validateEvent({
        ...draft,
        end: {
          date: { year: 2026, month: 7, day: 13 },
          time: { hour: 8, minute: 0 },
        },
      }),
    ).toEqual([]);
  });

  it("does not ask an all-day event for times", () => {
    expect(
      validateEvent({
        ...draft,
        allDay: true,
        start: { date: draft.start.date },
        end: { date: draft.end.date },
      }),
    ).toEqual([]);
  });

  it("lists every problem in the order of the form: title, note, URL, dates, times", () => {
    expect(
      validateEvent({
        ...draft,
        title: "",
        note: "n".repeat(NOTE_MAX_LENGTH + 1),
        url: "ftp://example.com",
        start: { date: { year: 2026, month: 7, day: 12 } },
        end: { date: { year: 2026, month: 7, day: 11 } },
      }),
    ).toEqual([
      "タイトルを入力してください",
      `備考は${NOTE_MAX_LENGTH}文字以内にしてください`,
      "URLは http/https のみ使用できます",
      "終了日は開始日以降にしてください",
      "時間イベントは開始・終了時刻が必要です",
    ]);
  });
});

describe("sortForDay", () => {
  it("all-day events first, then timed events by start time ascending", () => {
    const t9 = timed("t9", [2026, 7, 12], 9, 10);
    const t8 = timed("t8", [2026, 7, 12], 8, 9);
    const a = allDay("a", [2026, 7, 12], [2026, 7, 12]);
    expect(sortForDay([t9, a, t8]).map((e) => e.id)).toEqual(["a", "t8", "t9"]);
  });
});

describe("isStoredCalendarEvent", () => {
  const validAllDay = allDay("ok", [2026, 7, 12], [2026, 7, 12]);
  const validTimed = timed("okt", [2026, 7, 12], 9, 10);

  it("accepts a valid all-day event", () => {
    expect(isStoredCalendarEvent(validAllDay)).toBe(true);
  });
  it("accepts a valid timed event", () => {
    expect(isStoredCalendarEvent(validTimed)).toBe(true);
  });
  it("rejects null and non-objects", () => {
    expect(isStoredCalendarEvent(null)).toBe(false);
    expect(isStoredCalendarEvent("x")).toBe(false);
    expect(isStoredCalendarEvent(42)).toBe(false);
  });
  it("rejects a missing or empty id", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, id: undefined })).toBe(
      false,
    );
    expect(isStoredCalendarEvent({ ...validAllDay, id: "" })).toBe(false);
  });
  it("rejects a missing numeric start.date (source of a crash)", () => {
    expect(
      isStoredCalendarEvent({
        ...validAllDay,
        start: { date: { year: 2026, month: 7 } },
      }),
    ).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, start: undefined })).toBe(
      false,
    );
  });
  it("rejects a timed event without time (source of a crash in clip)", () => {
    expect(
      isStoredCalendarEvent({
        ...validTimed,
        start: { date: { year: 2026, month: 7, day: 12 } },
      }),
    ).toBe(false);
  });
  it("rejects an invalid colorKey or priority", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, colorKey: "neon" })).toBe(
      false,
    );
    expect(isStoredCalendarEvent({ ...validAllDay, priority: "urgent" })).toBe(
      false,
    );
  });
  it("rejects non-numeric createdAt or updatedAt", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, createdAt: "0" })).toBe(
      false,
    );
  });

  it("rejects a title, an id or an all-day flag of the wrong type", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, title: 1 })).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, id: 1 })).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, allDay: "yes" })).toBe(
      false,
    );
  });

  it("rejects an end point that is not a date", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, end: { date: 1 } })).toBe(
      false,
    );
    expect(isStoredCalendarEvent({ ...validAllDay, start: null })).toBe(false);
  });

  it("accepts a URL and a note when they are strings, or absent", () => {
    expect(
      isStoredCalendarEvent({
        ...validAllDay,
        url: "https://x.test",
        note: "n",
      }),
    ).toBe(true);
    expect(
      isStoredCalendarEvent({
        ...validAllDay,
        url: undefined,
        note: undefined,
      }),
    ).toBe(true);
  });

  it("rejects a URL or a note that is not a string", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, url: 1 })).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, note: {} })).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, url: null })).toBe(false);
  });

  it("does not ask an all-day event for times, but asks a timed one", () => {
    expect(
      isStoredCalendarEvent({
        ...validAllDay,
        start: { date: validAllDay.start.date },
      }),
    ).toBe(true);
    expect(
      isStoredCalendarEvent({
        ...validTimed,
        end: { date: validTimed.end.date },
      }),
    ).toBe(false);
  });
});
