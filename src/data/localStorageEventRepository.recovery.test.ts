import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/domain/event";
import { LocalStorageEventRepository } from "./localStorageEventRepository";
import { MAX_STORED_CHARS, STORAGE_VERSION } from "./storageFormat";

const KEY = "tonihaya.events";
const BACKUP = `${KEY}.backup`;
const LEGACY = `${KEY}.legacy-v0`;

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
});
