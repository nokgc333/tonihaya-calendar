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

describe("decodeEvents: data that cannot be read", () => {
  it.each([
    ["broken JSON", "{bad"],
    ["a JSON text that is not a list or an envelope", '"hello"'],
    ["a number", "42"],
    ["null", "null"],
    ["an envelope whose events are not a list", '{"version":1,"events":"x"}'],
    ["an envelope without events", '{"version":1}'],
    [
      "an envelope with a version that is not a number",
      '{"version":"1","events":[]}',
    ],
    ["an envelope with a negative version", '{"version":-1,"events":[]}'],
    ["an envelope with a fractional version", '{"version":1.5,"events":[]}'],
  ])("calls %s corrupt and returns no events", (_name, raw) => {
    const r = decodeEvents(raw);
    expect(r.status).toBe("corrupt");
    expect(r.events).toEqual([]);
  });

  it("calls a text that is too big too large, without reading it", () => {
    const r = decodeEvents(`[${"1,".repeat(MAX_STORED_CHARS)}1]`);
    expect(r.status).toBe("too-large");
    expect(r.events).toEqual([]);
  });

  it("calls a version from the future by its name, so that it is not thrown away unseen", () => {
    const r = decodeEvents(
      JSON.stringify({ version: STORAGE_VERSION + 1, events: [ev("a")] }),
    );
    expect(r.status).toBe("future");
    expect(r.events).toEqual([]);
  });
});

describe("decodeEvents: events that cannot be used", () => {
  it("keeps the good events, sets the bad ones aside with the reason and loses nothing", () => {
    const bad = { ...ev("bad"), colorKey: "neon" };
    const r = decodeEvents(
      encodeEvents([ev("a")]).replace("]}", `,${JSON.stringify(bad)}]}`),
    );
    expect(r.events.map((e) => e.id)).toEqual(["a"]);
    expect(r.rejected).toHaveLength(1);
    expect(r.rejected[0].value).toEqual(bad);
    expect(r.rejected[0].reason).toContain("colorKey");
  });

  it("repairs a link that is not safe and counts the repair", () => {
    const raw = JSON.stringify([{ ...ev("a"), url: "javascript:alert(1)" }]);
    const r = decodeEvents(raw);
    expect(r.events[0].url).toBeUndefined();
    expect(r.repaired).toBe(1);
  });

  it("keeps the first of two events with the same id and sets the second aside", () => {
    const r = decodeEvents(
      JSON.stringify([
        ev("a", { title: "first" }),
        ev("a", { title: "second" }),
      ]),
    );
    expect(r.events.map((e) => e.title)).toEqual(["first"]);
    expect(r.rejected[0].reason).toContain("duplicate");
  });

  it("sets aside the events beyond the limit", () => {
    const many = Array.from({ length: MAX_EVENTS + 3 }, (_, i) =>
      ev(`e${i}`, { title: "t" }),
    );
    const r = decodeEvents(JSON.stringify(many));
    expect(r.events).toHaveLength(MAX_EVENTS);
    expect(r.rejected).toHaveLength(3);
    expect(r.rejected[0].reason).toContain("limit");
  });

  it("does not let a hostile key reach the events", () => {
    const raw = `[{"id":"a","title":"t","allDay":true,"start":{"date":{"year":2026,"month":7,"day":1}},"end":{"date":{"year":2026,"month":7,"day":1}},"colorKey":"blue","priority":"normal","createdAt":1,"updatedAt":1,"__proto__":{"polluted":true}}]`;
    const r = decodeEvents(raw);
    expect(r.events).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(
      (r.events[0] as unknown as Record<string, unknown>).polluted,
    ).toBeUndefined();
  });
});

describe("decodeEvents never fails", () => {
  const garbage: unknown[] = [
    undefined,
    null,
    0,
    -1,
    1e308,
    "",
    " ",
    "\u0000",
    "[",
    "]",
    "{}",
    "[[]]",
    "[null]",
    "[{}]",
    "[[],[]]",
    '{"version":1,"events":[null,1,"x",[],{}]}',
    '{"version":0}',
    '{"events":[]}',
    "[" + "[".repeat(2000),
    "{".repeat(2000),
    '[{"id":"a","__proto__":1}]',
    "true",
    "false",
    "[true]",
    '["\\ud800"]',
  ];
  it.each(garbage.map((g) => [String(g).slice(0, 30), g]))(
    "survives %s",
    (_name, raw) => {
      expect(() => decodeEvents(raw as string | null)).not.toThrow();
      const r = decodeEvents(raw as string | null);
      expect(Array.isArray(r.events)).toBe(true);
      expect(Array.isArray(r.rejected)).toBe(true);
    },
  );

  it("survives a thousand random texts", () => {
    let seed = 12345;
    const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
    const alphabet = '[]{}":,0123456789abcdetrulfs _-.\\/';
    for (let i = 0; i < 1000; i += 1) {
      const length = next() % 80;
      const text = Array.from(
        { length },
        () => alphabet[next() % alphabet.length],
      ).join("");
      expect(() => decodeEvents(text), text).not.toThrow();
    }
  });
});
