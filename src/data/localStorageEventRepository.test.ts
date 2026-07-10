import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageEventRepository } from "./localStorageEventRepository";
import type { CalendarEvent } from "@/domain/event";

// 最小のインメモリ storage
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

// setItem が常に失敗する storage（容量超過・プライベートモードを模す）
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
  it("add→list で往復する", async () => {
    await repo.add(ev("a"));
    expect((await repo.list()).map((e) => e.id)).toEqual(["a"]);
  });
  it("update で置換、remove で削除", async () => {
    await repo.add(ev("a"));
    await repo.update({ ...ev("a"), title: "renamed" });
    expect((await repo.list())[0].title).toBe("renamed");
    await repo.remove("a");
    expect(await repo.list()).toEqual([]);
  });
  it("壊れたJSONは空配列にフォールバック", async () => {
    const s = new MemStorage();
    s.setItem("tonihaya.events", "{bad");
    const r = new LocalStorageEventRepository(s as unknown as Storage);
    expect(await r.list()).toEqual([]);
  });
  it("保存失敗時は開発ログを出しつつ例外を伝播する（サイレントなデータ欠損を防ぐ）", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = new LocalStorageEventRepository(new ThrowingStorage() as unknown as Storage);
    await expect(r.add(ev("a"))).rejects.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
