import { describe, expect, it } from "vitest";
import {
  clipEventToDay,
  eventsForDay,
  isSafeUrl,
  isStoredCalendarEvent,
  layoutDayColumns,
  minutesOfDay,
  sortForDay,
  validateEvent,
  NOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  URL_MAX_LENGTH,
  type DaySegment,
} from "./event";
import type { CalendarEvent } from "./types";

const base = { colorKey: "blue", priority: "normal", createdAt: 0, updatedAt: 0 } as const;
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
  start: { date: { year: d[0], month: d[1], day: d[2] }, time: { hour: sh, minute: 0 } },
  end: { date: { year: d[0], month: d[1], day: d[2] }, time: { hour: eh, minute: 0 } },
});

describe("minutesOfDay", () => {
  it("時刻を当日分に換算する", () => {
    expect(minutesOfDay({ hour: 9, minute: 30 })).toBe(570);
  });
});

describe("eventsForDay", () => {
  it("範囲に該当日を含むイベントを返す（複数日の中日も含む）", () => {
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
    start: { date: { year: 2026, month: 7, day: 10 }, time: { hour: 23, minute: 0 } },
    end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 2, minute: 0 } },
  };
  it("初日は開始時刻〜24:00・翌日へ継続", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 10 })!;
    expect([s.startMin, s.endMin, s.continuesFromPrev, s.continuesToNext]).toEqual([
      1380, 1440, false, true,
    ]);
  });
  it("中日は0:00〜24:00・両方継続", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 11 })!;
    expect([s.startMin, s.endMin, s.continuesFromPrev, s.continuesToNext]).toEqual([
      0, 1440, true, true,
    ]);
  });
  it("最終日は0:00〜終了時刻・前日から継続", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 12 })!;
    expect([s.startMin, s.endMin, s.continuesFromPrev, s.continuesToNext]).toEqual([
      0, 120, true, false,
    ]);
  });
  it("終日イベントは null", () => {
    expect(
      clipEventToDay(allDay("a", [2026, 7, 12], [2026, 7, 12]), { year: 2026, month: 7, day: 12 }),
    ).toBeNull();
  });
  it("範囲外の日は null", () => {
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
      start: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 0, minute: 0 } },
      end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 1, minute: 0 } },
    },
    startMin,
    endMin,
    continuesFromPrev: false,
    continuesToNext: false,
  });
  it("重ならなければ1列", () => {
    const out = layoutDayColumns([seg("a", 0, 60), seg("b", 120, 180)]);
    expect(out.every((s) => s.columnCount === 1 && s.columnIndex === 0)).toBe(true);
  });
  it("2つ重なると2列に割り当てる", () => {
    const out = layoutDayColumns([seg("a", 0, 120), seg("b", 60, 180)]);
    const a = out.find((s) => s.event.id === "a")!;
    const b = out.find((s) => s.event.id === "b")!;
    expect(a.columnCount).toBe(2);
    expect(b.columnCount).toBe(2);
    expect(new Set([a.columnIndex, b.columnIndex])).toEqual(new Set([0, 1]));
  });
  it("重ならないイベントは同クラスタに含めない（1列）", () => {
    const out = layoutDayColumns([seg("a", 0, 60), seg("b", 30, 90), seg("c", 200, 260)]);
    expect(out.find((s) => s.event.id === "c")!.columnCount).toBe(1);
    expect(out.find((s) => s.event.id === "a")!.columnCount).toBe(2);
  });
});

describe("isSafeUrl", () => {
  it("http/https は許可、それ以外は拒否", () => {
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
    start: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 9, minute: 0 } },
    end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 10, minute: 0 } },
  } as const;
  it("正常な時間イベントはエラー無し", () => {
    expect(validateEvent(okTimed)).toEqual([]);
  });
  it("タイトル空はエラー", () => {
    expect(validateEvent({ ...okTimed, title: "  " }).length).toBeGreaterThan(0);
  });
  it("同日で終了<=開始はエラー", () => {
    expect(
      validateEvent({
        ...okTimed,
        end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 9, minute: 0 } },
      }).length,
    ).toBeGreaterThan(0);
  });
  it("終了日<開始日はエラー", () => {
    expect(
      validateEvent({
        ...okTimed,
        end: { date: { year: 2026, month: 7, day: 11 }, time: { hour: 10, minute: 0 } },
      }).length,
    ).toBeGreaterThan(0);
  });
  it("不正URLはエラー", () => {
    expect(validateEvent({ ...okTimed, url: "javascript:alert(1)" }).length).toBeGreaterThan(0);
  });
  it("複数日の終日イベントは正常", () => {
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
  it("タイトルが上限超過はエラー", () => {
    expect(validateEvent({ ...okTimed, title: "あ".repeat(TITLE_MAX_LENGTH + 1) }).length).toBeGreaterThan(0);
  });
  it("タイトルが上限ちょうどは正常", () => {
    expect(validateEvent({ ...okTimed, title: "あ".repeat(TITLE_MAX_LENGTH) })).toEqual([]);
  });
  it("備考が上限超過はエラー", () => {
    expect(validateEvent({ ...okTimed, note: "n".repeat(NOTE_MAX_LENGTH + 1) }).length).toBeGreaterThan(0);
  });
  it("URLが上限超過はエラー", () => {
    const longUrl = "https://example.com/" + "a".repeat(URL_MAX_LENGTH);
    expect(validateEvent({ ...okTimed, url: longUrl }).length).toBeGreaterThan(0);
  });
});

describe("sortForDay", () => {
  it("終日→時間、時間は開始時刻昇順", () => {
    const t9 = timed("t9", [2026, 7, 12], 9, 10);
    const t8 = timed("t8", [2026, 7, 12], 8, 9);
    const a = allDay("a", [2026, 7, 12], [2026, 7, 12]);
    expect(sortForDay([t9, a, t8]).map((e) => e.id)).toEqual(["a", "t8", "t9"]);
  });
});

describe("isStoredCalendarEvent", () => {
  const validAllDay = allDay("ok", [2026, 7, 12], [2026, 7, 12]);
  const validTimed = timed("okt", [2026, 7, 12], 9, 10);

  it("正常な終日イベントを通す", () => {
    expect(isStoredCalendarEvent(validAllDay)).toBe(true);
  });
  it("正常な時間イベントを通す", () => {
    expect(isStoredCalendarEvent(validTimed)).toBe(true);
  });
  it("null/非オブジェクトを弾く", () => {
    expect(isStoredCalendarEvent(null)).toBe(false);
    expect(isStoredCalendarEvent("x")).toBe(false);
    expect(isStoredCalendarEvent(42)).toBe(false);
  });
  it("id 欠落・空文字を弾く", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, id: undefined })).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, id: "" })).toBe(false);
  });
  it("start.date の数値欠落を弾く（クラッシュ元）", () => {
    expect(
      isStoredCalendarEvent({ ...validAllDay, start: { date: { year: 2026, month: 7 } } }),
    ).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, start: undefined })).toBe(false);
  });
  it("時間イベントで time 欠落を弾く（clip でのクラッシュ元）", () => {
    expect(
      isStoredCalendarEvent({ ...validTimed, start: { date: { year: 2026, month: 7, day: 12 } } }),
    ).toBe(false);
  });
  it("不正な colorKey/priority を弾く", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, colorKey: "neon" })).toBe(false);
    expect(isStoredCalendarEvent({ ...validAllDay, priority: "urgent" })).toBe(false);
  });
  it("createdAt/updatedAt の非数値を弾く", () => {
    expect(isStoredCalendarEvent({ ...validAllDay, createdAt: "0" })).toBe(false);
  });
});
