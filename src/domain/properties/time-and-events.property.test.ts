import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  clipEventToDay,
  eventsForDay,
  layoutDayColumns,
  minutesOfDay,
  sortForDay,
  type CalendarEvent,
  type DaySegment,
} from "@/domain/event";
import { toEpochDay } from "@/domain/shared/date";
import {
  addDays,
  addDurationToTime,
  addDurations,
  diffTime,
} from "@/domain/timecalc";
import { appDate, timeOfDay } from "./arbitraries";

const total = (t: { hour: number; minute: number }) => t.hour * 60 + t.minute;

describe("times of day", () => {
  it("stay on the clock after any amount is added, and say how many days they passed", () => {
    fc.assert(
      fc.property(
        timeOfDay,
        fc.integer({ min: -100000, max: 100000 }),
        (t, delta) => {
          const r = addDurationToTime(t, delta);
          expect(r.time.hour).toBeGreaterThanOrEqual(0);
          expect(r.time.hour).toBeLessThanOrEqual(23);
          expect(r.time.minute).toBeGreaterThanOrEqual(0);
          expect(r.time.minute).toBeLessThanOrEqual(59);
          expect(r.dayOffset * 1440 + total(r.time)).toBe(total(t) + delta);
        },
      ),
    );
  });

  it("come back to the same time when an amount is added and taken away", () => {
    fc.assert(
      fc.property(
        timeOfDay,
        fc.integer({ min: -5000, max: 5000 }),
        (t, delta) => {
          const there = addDurationToTime(t, delta);
          const back = addDurationToTime(
            there.time,
            -delta + there.dayOffset * 1440,
          );
          expect(back.time).toEqual(t);
        },
      ),
    );
  });

  it("measure the time between two moments as a duration of less than a day that reaches the end", () => {
    fc.assert(
      fc.property(timeOfDay, timeOfDay, (a, b) => {
        const d = diffTime(a, b);
        expect(d.hours).toBeGreaterThanOrEqual(0);
        expect(d.hours).toBeLessThan(24);
        expect(d.minutes).toBeGreaterThanOrEqual(0);
        expect(d.minutes).toBeLessThan(60);
        const reached = addDurationToTime(a, d.hours * 60 + d.minutes);
        expect(reached.time).toEqual(b);
      }),
    );
  });

  it("add durations as minutes, in either order", () => {
    const duration = fc.record({
      hours: fc.integer({ min: 0, max: 50 }),
      minutes: fc.integer({ min: 0, max: 59 }),
    });
    fc.assert(
      fc.property(duration, duration, (a, b) => {
        const sum = addDurations(a, b);
        expect(sum.minutes).toBeLessThan(60);
        expect(sum.hours * 60 + sum.minutes).toBe(
          a.hours * 60 + a.minutes + b.hours * 60 + b.minutes,
        );
        expect(addDurations(b, a)).toEqual(sum);
      }),
    );
  });

  it("count a day more for every day added to a date", () => {
    fc.assert(
      fc.property(appDate, fc.integer({ min: 0, max: 3000 }), (d, n) => {
        const moved = addDays(d, n);
        expect(
          toEpochDay(moved.year, moved.month, moved.day) -
            toEpochDay(d.year, d.month, d.day),
        ).toBe(n);
      }),
    );
  });
});

const eventArb = fc
  .tuple(
    appDate,
    fc.integer({ min: 0, max: 5 }),
    fc.boolean(),
    timeOfDay,
    timeOfDay,
    fc.integer({ min: 0, max: 100 }),
    fc.constantFrom("low", "normal", "high" as const),
    fc.integer({ min: 0, max: 1_000_000_000 }),
  )
  .map(
    ([
      start,
      span,
      allDay,
      t1,
      t2,
      createdAt,
      priority,
      key,
    ]): CalendarEvent => {
      const end = addDays(start, span);
      const [from, to] = total(t1) <= total(t2) ? [t1, t2] : [t2, t1];
      return {
        id: `e${key}`,
        title: "t",
        allDay,
        start: { date: start, ...(allDay ? {} : { time: from }) },
        end: { date: end, ...(allDay ? {} : { time: to }) },
        colorKey: "blue",
        priority: priority as CalendarEvent["priority"],
        createdAt,
        updatedAt: createdAt,
      };
    },
  );

describe("the events of a day", () => {
  it("are those whose dates reach the day, and only those", () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { maxLength: 8 }),
        appDate,
        (events, day) => {
          const found = new Set(eventsForDay(events, day).map((e) => e.id));
          const d = toEpochDay(day.year, day.month, day.day);
          for (const e of events) {
            const inside =
              toEpochDay(
                e.start.date.year,
                e.start.date.month,
                e.start.date.day,
              ) <= d &&
              d <=
                toEpochDay(e.end.date.year, e.end.date.month, e.end.date.day);
            expect(found.has(e.id)).toBe(inside);
          }
        },
      ),
    );
  });

  it("clip to the day with a start before the end, and say whether the event goes on from or to the next days", () => {
    fc.assert(
      fc.property(eventArb, appDate, (event, day) => {
        const seg = clipEventToDay(event, day);
        const reaches = eventsForDay([event], day).length === 1;
        expect(seg !== null).toBe(reaches && !event.allDay);
        if (seg === null) return;
        expect(seg.startMin).toBeGreaterThanOrEqual(0);
        expect(seg.endMin).toBeLessThanOrEqual(1440);
        expect(seg.startMin).toBeLessThanOrEqual(seg.endMin);
        expect(seg.continuesFromPrev).toBe(
          toEpochDay(
            event.start.date.year,
            event.start.date.month,
            event.start.date.day,
          ) < toEpochDay(day.year, day.month, day.day),
        );
        if (!seg.continuesFromPrev)
          expect(seg.startMin).toBe(minutesOfDay(event.start.time!));
        if (!seg.continuesToNext)
          expect(seg.endMin).toBe(minutesOfDay(event.end.time!));
      }),
    );
  });
});

const segmentArb = fc
  .tuple(
    fc.integer({ min: 0, max: 1380 }),
    fc.integer({ min: 1, max: 240 }),
    fc.integer({ min: 0, max: 1_000_000_000 }),
  )
  .map(([start, length, key]): DaySegment => ({
    event: { id: `s${key}` } as CalendarEvent,
    startMin: start,
    endMin: Math.min(1440, start + length),
    continuesFromPrev: false,
    continuesToNext: false,
  }));

describe("the columns of a day", () => {
  const overlap = (a: DaySegment, b: DaySegment) =>
    a.startMin < b.endMin && b.startMin < a.endMin;

  it("keep every segment, once", () => {
    fc.assert(
      fc.property(fc.array(segmentArb, { maxLength: 12 }), (segments) => {
        const laid = layoutDayColumns(segments);
        expect(laid).toHaveLength(segments.length);
        expect(laid.map((l) => l.event.id).sort()).toEqual(
          segments.map((s) => s.event.id).sort(),
        );
      }),
    );
  });

  it("never put two segments that overlap in time into the same column", () => {
    fc.assert(
      fc.property(fc.array(segmentArb, { maxLength: 12 }), (segments) => {
        const laid = layoutDayColumns(segments);
        for (let i = 0; i < laid.length; i += 1) {
          for (let j = i + 1; j < laid.length; j += 1) {
            if (overlap(laid[i], laid[j]))
              expect(laid[i].columnIndex).not.toBe(laid[j].columnIndex);
          }
        }
      }),
    );
  });

  it("keep each segment inside the number of columns of its group", () => {
    fc.assert(
      fc.property(fc.array(segmentArb, { maxLength: 12 }), (segments) => {
        for (const l of layoutDayColumns(segments)) {
          expect(l.columnIndex).toBeGreaterThanOrEqual(0);
          expect(l.columnIndex).toBeLessThan(l.columnCount);
        }
      }),
    );
  });

  it("use a single column for segments that never overlap", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 20 }), { maxLength: 10 }),
        (slots) => {
          const unique = [...new Set(slots)];
          const segments = unique.map((slot, i): DaySegment => ({
            event: { id: `n${i}` } as CalendarEvent,
            startMin: slot * 60,
            endMin: slot * 60 + 30,
            continuesFromPrev: false,
            continuesToNext: false,
          }));
          for (const l of layoutDayColumns(segments))
            expect(l.columnCount).toBe(1);
        },
      ),
    );
  });

  it("give the same layout whatever the order the segments come in", () => {
    fc.assert(
      fc.property(
        fc.array(segmentArb, { maxLength: 10 }),
        fc.nat(),
        (segments, seed) => {
          const rotated = [
            ...segments.slice(seed % (segments.length || 1)),
            ...segments.slice(0, seed % (segments.length || 1)),
          ];
          const key = (l: {
            event: { id?: string };
            columnIndex: number;
            columnCount: number;
          }) => `${l.event.id}:${l.columnIndex}/${l.columnCount}`;
          const a = layoutDayColumns(segments).map(key).sort();
          const b = layoutDayColumns(rotated).map(key).sort();
          const distinctTimes =
            new Set(segments.map((s) => `${s.startMin}-${s.endMin}`)).size ===
            segments.length;
          if (distinctTimes) expect(a).toEqual(b);
        },
      ),
    );
  });
});

describe("sorting the events of a day", () => {
  it("keeps every event, once", () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 10 }), (events) => {
        const sorted = sortForDay(events);
        expect(sorted.map((e) => e.id).sort()).toEqual(
          events.map((e) => e.id).sort(),
        );
      }),
    );
  });

  it("puts every all-day event before every timed one", () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 10 }), (events) => {
        const kinds = sortForDay(events).map((e) => e.allDay);
        const firstTimed = kinds.indexOf(false);
        if (firstTimed >= 0)
          expect(kinds.slice(firstTimed).every((k) => k === false)).toBe(true);
      }),
    );
  });

  it("is the same whatever the order of the events it is given", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(eventArb, { maxLength: 10, selector: (e) => e.id }),
        fc.nat(),
        (events, seed) => {
          const k = seed % (events.length || 1);
          const rotated = [...events.slice(k), ...events.slice(0, k)];
          const ids = (list: readonly CalendarEvent[]) => list.map((e) => e.id);
          const distinctKeys =
            new Set(
              events.map(
                (e) =>
                  `${e.allDay}|${e.start.time ? minutesOfDay(e.start.time) : ""}|${e.priority}|${e.createdAt}`,
              ),
            ).size === events.length;
          if (distinctKeys)
            expect(ids(sortForDay(rotated))).toEqual(ids(sortForDay(events)));
        },
      ),
    );
  });

  it("is already sorted when sorted again", () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 10 }), (events) => {
        const once = sortForDay(events);
        expect(sortForDay(once).map((e) => e.id)).toEqual(
          once.map((e) => e.id),
        );
      }),
    );
  });
});
