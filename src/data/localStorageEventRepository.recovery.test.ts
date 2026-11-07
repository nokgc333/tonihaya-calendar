import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { CalendarEvent } from "@/domain/event";
import { LocalStorageEventRepository } from "./localStorageEventRepository";
import { MAX_EVENTS, MAX_STORED_CHARS, STORAGE_VERSION } from "./storageFormat";

const KEY = "tonihaya.events";
const BACKUP = `${KEY}.backup`;
const LEGACY = `${KEY}.legacy-v0`;
const REJECTED = `${KEY}.rejected`;

class Memory {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v);
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  keys(): string[] {
    return [...this.m.keys()].sort();
  }
}

const legacyText = readFileSync(
  join(process.cwd(), "tests/fixtures/legacy-v0-events.json"),
  "utf-8",
);
const legacy: CalendarEvent[] = JSON.parse(legacyText);

const ev = (id: string, over: Record<string, unknown> = {}) => ({
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

const open = (initial?: string) => {
  const storage = new Memory();
  if (initial !== undefined) storage.setItem(KEY, initial);
  return {
    storage,
    repo: new LocalStorageEventRepository(storage as unknown as Storage),
  };
};

describe("an old file from the first version", () => {
  it("lists every event of it", async () => {
    const { repo } = open(legacyText);
    expect(await repo.list()).toEqual(legacy);
  });

  it("is rewritten in the current format, and the old text is kept aside", async () => {
    const { repo, storage } = open(legacyText);
    await repo.list();
    expect(JSON.parse(storage.getItem(KEY)!).version).toBe(STORAGE_VERSION);
    expect(storage.getItem(LEGACY)).toBe(legacyText);
  });

  it("keeps the latest old text aside when the old format is written again, as after going back to an older release", async () => {
    const { repo, storage } = open(legacyText);
    await repo.list();
    const newer = JSON.stringify([...legacy, ev("written-by-the-old-release")]);
    storage.setItem(KEY, newer);
    expect((await repo.list()).map((e) => e.id)).toContain(
      "written-by-the-old-release",
    );
    expect(storage.getItem(LEGACY)).toBe(newer);
  });

  it("lets the user add an event to it without losing the others", async () => {
    const { repo } = open(legacyText);
    await repo.add(ev("new") as unknown as CalendarEvent);
    expect((await repo.list()).map((e) => e.id)).toEqual([
      ...legacy.map((e) => e.id),
      "new",
    ]);
  });
});

describe("a file that is broken", () => {
  it("lists nothing, keeps the text aside and clears the file, so that the app starts over without failing", async () => {
    const { repo, storage } = open("{bad");
    expect(await repo.list()).toEqual([]);
    expect(storage.getItem(BACKUP)).toBe("{bad");
    expect(storage.getItem(KEY)).toBeNull();
  });

  it("works again after the recovery", async () => {
    const { repo } = open("{bad");
    await repo.list();
    await repo.add(ev("a") as unknown as CalendarEvent);
    expect((await repo.list()).map((e) => e.id)).toEqual(["a"]);
  });

  it("keeps a file that is too big aside when there is room, and lists nothing", async () => {
    const big = `[${"1,".repeat(MAX_STORED_CHARS)}1]`;
    const { repo, storage } = open(big);
    expect(await repo.list()).toEqual([]);
    expect(storage.getItem(BACKUP)).toBe(big);
    expect(storage.getItem(KEY)).toBeNull();
  });

  it("keeps the file where it is when there is no room for a copy, instead of destroying it", async () => {
    const storage = new Memory();
    storage.setItem(KEY, "{bad");
    storage.setItem = (k: string) => {
      if (k === BACKUP) throw new DOMException("QuotaExceededError");
    };
    const repo = new LocalStorageEventRepository(storage as unknown as Storage);
    expect(await repo.list()).toEqual([]);
    expect(storage.getItem(KEY)).toBe("{bad");
  });

  it("keeps a file from a newer version aside instead of overwriting it", async () => {
    const future = JSON.stringify({
      version: STORAGE_VERSION + 1,
      events: [ev("a")],
    });
    const { repo, storage } = open(future);
    expect(await repo.list()).toEqual([]);
    expect(storage.getItem(BACKUP)).toBe(future);
  });

  it("does not fail when the storage cannot be read at all", async () => {
    const repo = new LocalStorageEventRepository({
      getItem: () => {
        throw new DOMException("SecurityError");
      },
    } as unknown as Storage);
    expect(await repo.list()).toEqual([]);
  });
});

describe("events that cannot be used", () => {
  it("lists the good ones, sets the bad ones aside with the reason and drops them from the file", async () => {
    const bad = ev("bad", { colorKey: "neon" });
    const { repo, storage } = open(JSON.stringify([ev("a"), bad, ev("b")]));
    expect((await repo.list()).map((e) => e.id)).toEqual(["a", "b"]);
    const aside = JSON.parse(storage.getItem(REJECTED)!);
    expect(aside).toHaveLength(1);
    expect(aside[0].value).toEqual(bad);
    expect(aside[0].reason).toContain("colorKey");
    expect(JSON.parse(storage.getItem(KEY)!).events).toHaveLength(2);
  });

  it("keeps only the latest hundred of the events set aside", async () => {
    const { repo, storage } = open(
      JSON.stringify([
        ev("ok"),
        ...Array.from({ length: 130 }, (_, i) => ({
          ...ev(`b${i}`),
          colorKey: "neon",
        })),
      ]),
    );
    await repo.list();
    const aside = JSON.parse(storage.getItem(REJECTED)!);
    expect(aside).toHaveLength(100);
    expect(aside[99].value.id).toBe("b129");
  });

  it("repairs a hostile link in the file, so that it is gone from what is stored too", async () => {
    const { repo, storage } = open(
      JSON.stringify([ev("a", { url: "javascript:alert(1)" })]),
    );
    expect((await repo.list())[0].url).toBeUndefined();
    expect(storage.getItem(KEY)).not.toContain("javascript:");
  });

  it("leaves a clean file as it is, without writing", async () => {
    const { repo, storage } = open(
      JSON.stringify({ version: STORAGE_VERSION, events: [ev("a")] }),
    );
    const before = storage.getItem(KEY);
    await repo.list();
    expect(storage.getItem(KEY)).toBe(before);
    expect(storage.keys()).toEqual([KEY]);
  });
});

describe("saving too much", () => {
  it("refuses an event beyond the limit, says so, and keeps what is stored", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const many = Array.from({ length: MAX_EVENTS }, (_, i) =>
      ev(`e${i}`, { title: "t" }),
    );
    const { repo, storage } = open(
      JSON.stringify({ version: STORAGE_VERSION, events: many }),
    );
    const before = storage.getItem(KEY);
    await expect(
      repo.add(ev("one-too-many") as unknown as CalendarEvent),
    ).rejects.toThrow(/limit/);
    expect(storage.getItem(KEY)).toBe(before);
  });

  it("refuses a note that would make the file too big", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { repo } = open();
    await expect(
      repo.add(
        ev("big", {
          note: "x".repeat(MAX_STORED_CHARS),
        }) as unknown as CalendarEvent,
      ),
    ).rejects.toThrow(/limit/);
  });
});

describe("whatever the storage holds", () => {
  it.each([
    "{bad",
    "null",
    "42",
    '"x"',
    "[null]",
    "[{}]",
    "[[]]",
    '{"version":9,"events":[]}',
    "[" + "[".repeat(500),
  ])("lists without failing for %s", async (raw) => {
    const { repo } = open(raw);
    await expect(repo.list()).resolves.toBeInstanceOf(Array);
    await expect(
      repo.add(ev("a") as unknown as CalendarEvent),
    ).resolves.toBeUndefined();
    expect((await repo.list()).map((e) => e.id)).toContain("a");
  });
});
