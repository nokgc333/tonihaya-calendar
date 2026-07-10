import { isStoredCalendarEvent } from "@/domain/event";
import type { CalendarEvent } from "@/domain/event";
import type { EventRepository } from "./eventRepository";

const KEY = "tonihaya.events";

export class LocalStorageEventRepository implements EventRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  private read(): CalendarEvent[] {
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // 配列でない・要素が壊れている場合は該当分を除外（1件の破損で全体を壊さない）。
      return Array.isArray(parsed) ? parsed.filter(isStoredCalendarEvent) : [];
    } catch {
      // 壊れたデータは握りつぶさず空へフォールバック（読み取り不能でアプリを止めない）
      return [];
    }
  }

  private write(events: readonly CalendarEvent[]): void {
    try {
      this.storage.setItem(KEY, JSON.stringify(events));
    } catch (err) {
      // 容量超過・プライベートモード等で保存に失敗。握りつぶすと UI 上は保存成功に見え、
      // リロードで消えるサイレントなデータ欠損になるため、開発ログを残し上位へ伝播させる。
      console.error(`予定の永続化に失敗しました (key=${KEY})`, err);
      throw err;
    }
  }

  async list(): Promise<readonly CalendarEvent[]> {
    return this.read();
  }

  async add(event: CalendarEvent): Promise<void> {
    this.write([...this.read(), event]);
  }

  async update(event: CalendarEvent): Promise<void> {
    this.write(this.read().map((e) => (e.id === event.id ? event : e)));
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((e) => e.id !== id));
  }
}
