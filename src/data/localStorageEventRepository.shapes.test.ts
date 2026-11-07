import { describe, expect, it } from "vitest";
import { LocalStorageEventRepository } from "./localStorageEventRepository";
import type { CalendarEvent } from "@/domain/event";

const STORAGE_KEY = "tonihaya.events";

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
}

const valid: CalendarEvent = {
  id: "kept",
  title: "kept",
  allDay: true,
  start: { date: { year: 2026, month: 7, day: 1 } },
  end: { date: { year: 2026, month: 7, day: 1 } },
  colorKey: "blue",
  priority: "normal",
  createdAt: 1,
  updatedAt: 1,
};

const repoWith = (stored: unknown) => {
  const storage = new Memory();
  if (stored !== undefined)
    storage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return new LocalStorageEventRepository(storage as unknown as Storage);
};

describe("LocalStorageEventRepository stored shapes", () => {
  it("lists nothing when nothing is stored", async () => {
    expect(await repoWith(undefined).list()).toEqual([]);
  });

  it("ignores stored data that is not an array", async () => {
    expect(await repoWith({ not: "an array" }).list()).toEqual([]);
  });

  it("drops stored entries that are not valid events and keeps the valid ones", async () => {
    const repo = repoWith([valid, { id: 1 }, null, "x"]);
    expect((await repo.list()).map((e) => e.id)).toEqual(["kept"]);
  });
});
