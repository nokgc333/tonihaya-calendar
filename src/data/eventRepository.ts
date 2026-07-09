import type { CalendarEvent } from "@/domain/event";

/** イベントの永続化。UI/ドメインはこのインターフェースにのみ依存する（保存先を差し替え可能）。 */
export interface EventRepository {
  list(): Promise<readonly CalendarEvent[]>;
  add(event: CalendarEvent): Promise<void>;
  update(event: CalendarEvent): Promise<void>;
  remove(id: string): Promise<void>;
}
