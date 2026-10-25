import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageEventRepository } from "./localStorageEventRepository";
import type { CalendarEvent } from "@/domain/event";

class MemStorage {
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

class ThrowingStorage extends MemStorage {
  override setItem(): void {
    throw new DOMException("QuotaExceededError");
  }
}

const ev = (id: string): CalendarEvent => ({
  id,
  title: id,
  allDay: true,
  start: { date: { year: 2026, month: 7, day: 1 } },
  end: { date: { year: 2026, month: 7, day: 1 } },
  colorKey: "blue",
  priority: "normal",
  createdAt: 1,
  updatedAt: 1,
});

describe("LocalStorageEventRepository", () => {
  let repo: LocalStorageEventRepository;
  beforeEach(() => {
    repo = new LocalStorageEventRepository(new MemStorage() as unknown as Storage);
  });
  it("round-trips through add and list", async () => {
    await repo.add(ev("a"));
    expect((await repo.list()).map((e) => e.id)).toEqual(["a"]);
  });
  it("replaces with update and deletes with remove", async () => {
    await repo.add(ev("a"));
    await repo.update({ ...ev("a"), title: "renamed" });
    expect((await repo.list())[0].title).toBe("renamed");
    await repo.remove("a");
    expect(await repo.list()).toEqual([]);
  });
  it("falls back to an empty array for broken JSON", async () => {
    const s = new MemStorage();
    s.setItem("tonihaya.events", "{bad");
    const r = new LocalStorageEventRepository(s as unknown as Storage);
    expect(await r.list()).toEqual([]);
  });
  it("logs for development and propagates the exception when saving fails (prevents silent data loss)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = new LocalStorageEventRepository(new ThrowingStorage() as unknown as Storage);
    await expect(r.add(ev("a"))).rejects.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
