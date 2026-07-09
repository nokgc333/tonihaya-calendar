# イベント機能 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 予定（イベント）の作成・表示・編集・削除を localStorage 永続で追加し、L0〜L3 各ビューに表示する（v0.2.0）。

**Architecture:** ドメイン純関数（`domain/event`）＋ `EventRepository` 非同期インターフェース（`data/`）＋ React Context/`useEvents` フックで状態注入。ビューは純関数で整形して描画。重なりは Google 風の列レイアウト。保存先は localStorage（将来 Supabase を実装追加で差し替え）。

**Tech Stack:** Next.js(App Router, static export) / React 19(Context, useState, flushSync) / TypeScript / Tailwind v4 / Vitest / Playwright(MCP)。

## Global Constraints

- コミット: `type: 日本語説明`（命令形・先頭小文字の英語型名・末尾ピリオドなし）、**`Co-Authored-By` なし**、1意味単位=1コミット。ブランチ `feat/events-mvp`（develop から。--no-ff で develop→main）。
- `npm run dev` はフックでブロック。検証は `npx next build` + `python3 -m http.server 4599 --directory out`（`cd` しない）+ Playwright(MCP)。3点セット: `npx vitest run && npx tsc --noEmit && npx next build`。First Load JS < 150KB。
- 色は必ず CSSトークン経由（ハードコード色禁止）。light/dark 両対応。
- 共通型は再利用: `CivilDate`（`@/domain/shared/date`）/ `TimeOfDay`（`@/domain/timecalc`）。DOM の `Event` と衝突回避で `CalendarEvent`。
- 素の値のみ（Date型を持たない）。`id = crypto.randomUUID()`。
- URL 描画は `http:`/`https:` のみ許可・サニタイズ（XSS対策）。`dangerouslySetInnerHTML` 不使用。
- 既存 116 テスト緑・ズーム遷移不変を維持。イベント要素に `view-transition-name` を付けない。
- 設計書: `docs/superpowers/specs/2026-07-09-events-mvp-design.md`。

---

## File Structure

- **Create** `src/domain/event/types.ts` — `CalendarEvent`/`EventPoint`/`EventColorKey`/`EventPriority`。
- **Create** `src/domain/event/event.ts` — 純関数（`eventsForDay`/`clipEventToDay`/`layoutDayColumns`/`sortForDay`/`validateEvent`/`minutesOfDay`）。
- **Create** `src/domain/event/event.test.ts` — 単体テスト。
- **Create** `src/domain/event/index.ts` — barrel。
- **Create** `src/data/eventRepository.ts` — `EventRepository` インターフェース。
- **Create** `src/data/localStorageEventRepository.ts` — 具体実装。
- **Create** `src/data/localStorageEventRepository.test.ts` — 往復テスト。
- **Create** `src/hooks/useEvents.tsx` — `EventProvider` ＋ `useEvents`。
- **Create** `src/components/eventColors.ts` — `colorKey` → CSSトークン解決＋パレット定義。
- **Create** `src/components/EventModal.tsx` — 作成/編集モーダル。
- **Create** `src/components/EventChip.tsx` — L1/L2 終日行のチップ。
- **Create** `src/components/DayTimedEvents.tsx` — L2/L3 時刻グリッド上のイベント層（clip＋layout）。
- **Modify** `src/app/globals.css` — 8色トークン（light/dark）。
- **Modify** `src/components/{DayView,WeekView,MonthDetail,OverviewBody}.tsx` — イベント表示の差し込み。
- **Modify** `src/components/CalendarApp.tsx` — `EventProvider` でラップ、作成トリガー配線。

---

## Task 1: ドメイン型と基本抽出（types / eventsForDay / sortForDay / minutesOfDay）

**Files:**
- Create: `src/domain/event/types.ts`, `src/domain/event/event.ts`, `src/domain/event/event.test.ts`, `src/domain/event/index.ts`

**Interfaces:**
- Consumes: `CivilDate`（`@/domain/shared/date`）, `TimeOfDay`（`@/domain/timecalc`）, `toEpochDay`（`@/domain/shared/date`）。
- Produces:
  - `CalendarEvent`, `EventPoint`, `EventColorKey`, `EventPriority`
  - `minutesOfDay(t: TimeOfDay): number`
  - `eventsForDay(events: readonly CalendarEvent[], date: CivilDate): readonly CalendarEvent[]`
  - `sortForDay(events: readonly CalendarEvent[]): readonly CalendarEvent[]`

- [ ] **Step 1: 型定義**

`src/domain/event/types.ts`:
```ts
import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";

export type EventColorKey =
  | "blue" | "green" | "teal" | "purple" | "pink" | "amber" | "slate" | "rose";
export type EventPriority = "low" | "normal" | "high";

export interface EventPoint {
  readonly date: CivilDate;
  readonly time?: TimeOfDay; // 時間イベント時のみ
}

export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly allDay: boolean;
  readonly start: EventPoint;
  readonly end: EventPoint;
  readonly colorKey: EventColorKey;
  readonly priority: EventPriority;
  readonly url?: string;
  readonly note?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}
```

- [ ] **Step 2: 失敗するテストを書く**

`src/domain/event/event.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { eventsForDay, minutesOfDay, sortForDay } from "./event";
import type { CalendarEvent } from "./types";

const base = { colorKey: "blue", priority: "normal", createdAt: 0, updatedAt: 0 } as const;
const allDay = (id: string, s: [number, number, number], e: [number, number, number]): CalendarEvent => ({
  ...base, id, title: id, allDay: true,
  start: { date: { year: s[0], month: s[1], day: s[2] } },
  end: { date: { year: e[0], month: e[1], day: e[2] } },
});
const timed = (id: string, d: [number, number, number], sh: number, eh: number): CalendarEvent => ({
  ...base, id, title: id, allDay: false,
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

describe("sortForDay", () => {
  it("終日→時間、時間は開始時刻昇順", () => {
    const t9 = timed("t9", [2026, 7, 12], 9, 10);
    const t8 = timed("t8", [2026, 7, 12], 8, 9);
    const a = allDay("a", [2026, 7, 12], [2026, 7, 12]);
    expect(sortForDay([t9, a, t8]).map((e) => e.id)).toEqual(["a", "t8", "t9"]);
  });
});
```

- [ ] **Step 3: 失敗を確認**

Run: `npx vitest run src/domain/event/event.test.ts`
Expected: FAIL（`./event` の関数未定義）。

- [ ] **Step 4: 実装**

`src/domain/event/event.ts`:
```ts
import { toEpochDay } from "@/domain/shared/date";
import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";
import type { CalendarEvent, EventPriority } from "./types";

export function minutesOfDay(t: TimeOfDay): number {
  return t.hour * 60 + t.minute;
}

const epoch = (d: CivilDate): number => toEpochDay(d.year, d.month, d.day);

export function eventsForDay(
  events: readonly CalendarEvent[],
  date: CivilDate,
): readonly CalendarEvent[] {
  const d = epoch(date);
  return events.filter((e) => epoch(e.start.date) <= d && d <= epoch(e.end.date));
}

const PRIORITY_RANK: Record<EventPriority, number> = { high: 0, normal: 1, low: 2 };

export function sortForDay(events: readonly CalendarEvent[]): readonly CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1; // 終日を先に
    if (!a.allDay && !b.allDay) {
      const am = minutesOfDay(a.start.time!);
      const bm = minutesOfDay(b.start.time!);
      if (am !== bm) return am - bm;
    }
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    return a.createdAt - b.createdAt;
  });
}
```

- [ ] **Step 5: パス確認**

Run: `npx vitest run src/domain/event/event.test.ts`
Expected: PASS。

- [ ] **Step 6: barrel とコミット**

`src/domain/event/index.ts`:
```ts
export * from "./types";
export * from "./event";
```
```bash
git add src/domain/event
git commit -m "feat: イベントのドメイン型と当日抽出・並び替えを追加する"
```

---

## Task 2: 時間イベントの日別クリップ（clipEventToDay）

**Files:**
- Modify: `src/domain/event/event.ts`, `src/domain/event/event.test.ts`

**Interfaces:**
- Produces:
  - `interface DaySegment { readonly event: CalendarEvent; readonly startMin: number; readonly endMin: number; readonly continuesFromPrev: boolean; readonly continuesToNext: boolean }`
  - `clipEventToDay(event: CalendarEvent, date: CivilDate): DaySegment | null`（allDay または対象日外は null）

- [ ] **Step 1: 失敗するテスト**

`event.test.ts` に追加:
```ts
import { clipEventToDay } from "./event";

describe("clipEventToDay", () => {
  const multi: CalendarEvent = {
    ...base, id: "m", title: "m", allDay: false,
    start: { date: { year: 2026, month: 7, day: 10 }, time: { hour: 23, minute: 0 } },
    end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 2, minute: 0 } },
  };
  it("初日は開始時刻〜24:00・翌日へ継続", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 10 })!;
    expect([s.startMin, s.endMin, s.continuesFromPrev, s.continuesToNext]).toEqual([1380, 1440, false, true]);
  });
  it("中日は0:00〜24:00・両方継続", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 11 })!;
    expect([s.startMin, s.endMin, s.continuesFromPrev, s.continuesToNext]).toEqual([0, 1440, true, true]);
  });
  it("最終日は0:00〜終了時刻・前日から継続", () => {
    const s = clipEventToDay(multi, { year: 2026, month: 7, day: 12 })!;
    expect([s.startMin, s.endMin, s.continuesFromPrev, s.continuesToNext]).toEqual([0, 120, true, false]);
  });
  it("終日イベントは null", () => {
    expect(clipEventToDay(allDay("a", [2026, 7, 12], [2026, 7, 12]), { year: 2026, month: 7, day: 12 })).toBeNull();
  });
});
```

- [ ] **Step 2: 失敗を確認** — Run: `npx vitest run src/domain/event/event.test.ts` → FAIL。

- [ ] **Step 3: 実装** — `event.ts` に追加:
```ts
export interface DaySegment {
  readonly event: CalendarEvent;
  readonly startMin: number;
  readonly endMin: number;
  readonly continuesFromPrev: boolean;
  readonly continuesToNext: boolean;
}

export function clipEventToDay(event: CalendarEvent, date: CivilDate): DaySegment | null {
  if (event.allDay) return null;
  const d = epoch(date);
  const s = epoch(event.start.date);
  const e = epoch(event.end.date);
  if (d < s || d > e) return null;
  const startMin = d === s ? minutesOfDay(event.start.time!) : 0;
  const endMin = d === e ? minutesOfDay(event.end.time!) : 1440;
  return { event, startMin, endMin, continuesFromPrev: d > s, continuesToNext: d < e };
}
```

- [ ] **Step 4: パス確認** — Run: `npx vitest run src/domain/event/event.test.ts` → PASS。

- [ ] **Step 5: コミット**
```bash
git add src/domain/event
git commit -m "feat: 時間イベントを日別に切り出すclipEventToDayを追加する"
```

---

## Task 3: 重なり横並びレイアウト（layoutDayColumns・Google風）

**Files:**
- Modify: `src/domain/event/event.ts`, `src/domain/event/event.test.ts`

**Interfaces:**
- Consumes: `DaySegment`（Task2）。
- Produces:
  - `interface LaidOutSegment extends DaySegment { readonly columnIndex: number; readonly columnCount: number }`
  - `layoutDayColumns(segments: readonly DaySegment[]): readonly LaidOutSegment[]`

**背景:** 重なる時間イベント群を、重なりクラスタ単位で列に割り当てる。`columnIndex`（0起点）と `columnCount`（そのクラスタの列数）から、幅 `100%/columnCount`・左 `columnIndex*100%/columnCount` を算出して横並び表示する。

- [ ] **Step 1: 失敗するテスト**
```ts
import { layoutDayColumns, type DaySegment } from "./event";

const seg = (id: string, startMin: number, endMin: number): DaySegment => ({
  event: { ...base, id, title: id, allDay: false,
    start: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 0, minute: 0 } },
    end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 1, minute: 0 } } },
  startMin, endMin, continuesFromPrev: false, continuesToNext: false,
});

describe("layoutDayColumns", () => {
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
```

- [ ] **Step 2: 失敗を確認** — FAIL。

- [ ] **Step 3: 実装** — `event.ts` に追加:
```ts
export interface LaidOutSegment extends DaySegment {
  readonly columnIndex: number;
  readonly columnCount: number;
}

export function layoutDayColumns(segments: readonly DaySegment[]): readonly LaidOutSegment[] {
  const sorted = [...segments].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const result: Array<DaySegment & { columnIndex: number }> = [];
  // 重なりクラスタ（連続的に重なる集合）ごとに列数を確定する
  let cluster: Array<DaySegment & { columnIndex: number }> = [];
  let clusterEnd = -1;
  const flush = (): void => {
    const count = cluster.reduce((m, s) => Math.max(m, s.columnIndex + 1), 0);
    for (const s of cluster) result.push({ ...s, columnCount: count } as LaidOutSegment);
    cluster = [];
    clusterEnd = -1;
  };
  const withCount: LaidOutSegment[] = [];
  for (const s of sorted) {
    if (cluster.length > 0 && s.startMin >= clusterEnd) {
      // クラスタ確定
      const count = cluster.reduce((m, c) => Math.max(m, c.columnIndex + 1), 0);
      for (const c of cluster) withCount.push({ ...c, columnCount: count });
      cluster = [];
      clusterEnd = -1;
    }
    // 空いている最小列を探す（クラスタ内で終了済みの列を再利用）
    const used = new Set(cluster.filter((c) => c.endMin > s.startMin).map((c) => c.columnIndex));
    let col = 0;
    while (used.has(col)) col++;
    const placed = { ...s, columnIndex: col };
    cluster.push(placed);
    clusterEnd = Math.max(clusterEnd, s.endMin);
  }
  if (cluster.length > 0) {
    const count = cluster.reduce((m, c) => Math.max(m, c.columnIndex + 1), 0);
    for (const c of cluster) withCount.push({ ...c, columnCount: count });
  }
  return withCount;
}
```

- [ ] **Step 4: パス確認** — PASS。境界（同開始・入れ子）も緑を確認。

- [ ] **Step 5: コミット**
```bash
git add src/domain/event
git commit -m "feat: 重なり時間イベントの横並びレイアウトを追加する"
```

---

## Task 4: バリデーション（validateEvent）

**Files:**
- Modify: `src/domain/event/event.ts`, `src/domain/event/event.test.ts`

**Interfaces:**
- Produces:
  - `interface EventDraft`（`CalendarEvent` から `id/createdAt/updatedAt` を除いた入力形）
  - `validateEvent(draft: EventDraft): readonly string[]`（エラーメッセージ配列。空なら妥当）
  - `isSafeUrl(url: string): boolean`（http/https のみ true）

- [ ] **Step 1: 失敗するテスト**
```ts
import { isSafeUrl, validateEvent } from "./event";

describe("isSafeUrl", () => {
  it("http/https は許可、それ以外は拒否", () => {
    expect(isSafeUrl("https://a.com")).toBe(true);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });
});
describe("validateEvent", () => {
  const okTimed = { title: "x", allDay: false, colorKey: "blue", priority: "normal",
    start: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 9, minute: 0 } },
    end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 10, minute: 0 } } } as const;
  it("正常な時間イベントはエラー無し", () => {
    expect(validateEvent(okTimed)).toEqual([]);
  });
  it("タイトル空はエラー", () => {
    expect(validateEvent({ ...okTimed, title: "  " }).length).toBeGreaterThan(0);
  });
  it("同日で終了<=開始はエラー", () => {
    expect(validateEvent({ ...okTimed, end: { date: { year: 2026, month: 7, day: 12 }, time: { hour: 9, minute: 0 } } }).length).toBeGreaterThan(0);
  });
  it("終了日<開始日はエラー", () => {
    expect(validateEvent({ ...okTimed, end: { date: { year: 2026, month: 7, day: 11 }, time: { hour: 10, minute: 0 } } }).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 失敗を確認** — FAIL。

- [ ] **Step 3: 実装** — `event.ts` に追加:
```ts
import type { EventPoint } from "./types";

export type EventDraft = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;

export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateEvent(d: EventDraft): readonly string[] {
  const errors: string[] = [];
  if (d.title.trim().length === 0) errors.push("タイトルを入力してください");
  if (d.url && !isSafeUrl(d.url)) errors.push("URLは http/https のみ使用できます");
  const s = epoch(d.start.date);
  const e = epoch(d.end.date);
  if (e < s) errors.push("終了日は開始日以降にしてください");
  if (!d.allDay) {
    if (!d.start.time || !d.end.time) errors.push("時間イベントは開始・終了時刻が必要です");
    else if (s === e && minutesOfDay(d.end.time) <= minutesOfDay(d.start.time)) {
      errors.push("終了時刻は開始時刻より後にしてください");
    }
  }
  return errors;
}
```

- [ ] **Step 4: パス確認** — PASS。

- [ ] **Step 5: コミット**
```bash
git add src/domain/event
git commit -m "feat: イベントの入力バリデーションとURL安全判定を追加する"
```

---

## Task 5: EventRepository とローカル実装

**Files:**
- Create: `src/data/eventRepository.ts`, `src/data/localStorageEventRepository.ts`, `src/data/localStorageEventRepository.test.ts`

**Interfaces:**
- Consumes: `CalendarEvent`。
- Produces:
  - `interface EventRepository { list(): Promise<readonly CalendarEvent[]>; add(e): Promise<void>; update(e): Promise<void>; remove(id: string): Promise<void> }`
  - `class LocalStorageEventRepository implements EventRepository`（コンストラクタで storage を注入可: `new LocalStorageEventRepository(storage?)`）

- [ ] **Step 1: インターフェース**

`src/data/eventRepository.ts`:
```ts
import type { CalendarEvent } from "@/domain/event";

export interface EventRepository {
  list(): Promise<readonly CalendarEvent[]>;
  add(event: CalendarEvent): Promise<void>;
  update(event: CalendarEvent): Promise<void>;
  remove(id: string): Promise<void>;
}
```

- [ ] **Step 2: 失敗するテスト（往復）**

`src/data/localStorageEventRepository.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageEventRepository } from "./localStorageEventRepository";
import type { CalendarEvent } from "@/domain/event";

// 最小のインメモリ storage
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
const ev = (id: string): CalendarEvent => ({
  id, title: id, allDay: true,
  start: { date: { year: 2026, month: 7, day: 1 } },
  end: { date: { year: 2026, month: 7, day: 1 } },
  colorKey: "blue", priority: "normal", createdAt: 1, updatedAt: 1,
});

describe("LocalStorageEventRepository", () => {
  let repo: LocalStorageEventRepository;
  beforeEach(() => { repo = new LocalStorageEventRepository(new MemStorage() as unknown as Storage); });
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
    const s = new MemStorage(); s.setItem("tonihaya.events", "{bad");
    const r = new LocalStorageEventRepository(s as unknown as Storage);
    expect(await r.list()).toEqual([]);
  });
});
```

- [ ] **Step 3: 失敗を確認** — FAIL。

- [ ] **Step 4: 実装**

`src/data/localStorageEventRepository.ts`:
```ts
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
      return Array.isArray(parsed) ? (parsed as CalendarEvent[]) : [];
    } catch {
      return []; // 壊れたデータは握りつぶさず空へフォールバック（ユーザーデータ保護）
    }
  }
  private write(events: readonly CalendarEvent[]): void {
    this.storage.setItem(KEY, JSON.stringify(events));
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
```

- [ ] **Step 5: パス確認** — Run: `npx vitest run src/data/` → PASS。

- [ ] **Step 6: コミット**
```bash
git add src/data
git commit -m "feat: イベントのlocalStorageリポジトリを追加する"
```

---

## Task 6: 状態注入（EventProvider / useEvents）

**Files:**
- Create: `src/hooks/useEvents.tsx`

**Interfaces:**
- Consumes: `EventRepository`, `LocalStorageEventRepository`, `CalendarEvent`, `EventDraft`。
- Produces:
  - `EventProvider({ children, repository? }): JSX`（省略時 `LocalStorageEventRepository`）
  - `useEvents(): { events: readonly CalendarEvent[]; loading: boolean; addEvent(draft: EventDraft): Promise<void>; updateEvent(e: CalendarEvent): Promise<void>; removeEvent(id: string): Promise<void> }`

- [ ] **Step 1: 実装**

`src/hooks/useEvents.tsx`:
```tsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CalendarEvent, EventDraft } from "@/domain/event";
import { LocalStorageEventRepository } from "@/data/localStorageEventRepository";
import type { EventRepository } from "@/data/eventRepository";

interface EventContextValue {
  readonly events: readonly CalendarEvent[];
  readonly loading: boolean;
  addEvent(draft: EventDraft): Promise<void>;
  updateEvent(event: CalendarEvent): Promise<void>;
  removeEvent(id: string): Promise<void>;
}
const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({
  children,
  repository,
}: {
  readonly children: React.ReactNode;
  readonly repository?: EventRepository;
}) {
  // SSR/静的化では window 不在のため、マウント後に生成
  const [repo] = useState<EventRepository | null>(() => repository ?? null);
  const [resolvedRepo, setResolvedRepo] = useState<EventRepository | null>(repo);
  const [events, setEvents] = useState<readonly CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = resolvedRepo ?? new LocalStorageEventRepository();
    if (!resolvedRepo) setResolvedRepo(r);
    r.list().then((list) => {
      setEvents(list);
      setLoading(false);
    });
  }, [resolvedRepo]);

  const value = useMemo<EventContextValue>(() => {
    const r = () => resolvedRepo ?? new LocalStorageEventRepository();
    return {
      events,
      loading,
      async addEvent(draft) {
        const now = Date.now();
        const event: CalendarEvent = { ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        await r().add(event);
        setEvents((prev) => [...prev, event]);
      },
      async updateEvent(event) {
        const updated = { ...event, updatedAt: Date.now() };
        await r().update(updated);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      },
      async removeEvent(id) {
        await r().remove(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
      },
    };
  }, [events, loading, resolvedRepo]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents は EventProvider の内側で使用してください");
  return ctx;
}
```

- [ ] **Step 2: 検証（型・ビルド）**

Run: `npx tsc --noEmit && npx next build`
Expected: 型緑・ビルド成功（未使用でも壊さない）。

- [ ] **Step 3: コミット**
```bash
git add src/hooks/useEvents.tsx
git commit -m "feat: イベント状態のProviderとuseEventsフックを追加する"
```

---

## Task 7: 色パレット（トークン＋解決関数）

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/eventColors.ts`

**Interfaces:**
- Produces: `eventColor(key: EventColorKey): { readonly bg: string; readonly fg: string; readonly border: string }`（CSSトークン文字列）。`EVENT_COLOR_KEYS: readonly EventColorKey[]`。

- [ ] **Step 1: CSSトークン（light/dark・淡め・既存色と区別）**

`src/app/globals.css` の `:root`（light）と dark セクションに、8色 × {bg,fg,border} を追加。例（値は既存トークンの淡色系に合わせて調整、ビビッド回避）:
```css
:root {
  --ev-blue-bg: #e8f0fe;   --ev-blue-fg: #1f4e8c;   --ev-blue-border: #b9d0f7;
  --ev-green-bg: #e6f4ea;  --ev-green-fg: #1e6b3a;  --ev-green-border: #b7dfc4;
  --ev-teal-bg: #e2f3f2;   --ev-teal-fg: #1c6b66;   --ev-teal-border: #b3dfdb;
  --ev-purple-bg: #f0eafc; --ev-purple-fg: #5b3ea0; --ev-purple-border: #d6c6f2;
  --ev-pink-bg: #fce8f1;   --ev-pink-fg: #9b3467;   --ev-pink-border: #f2c4da;
  --ev-amber-bg: #fdf3e2;  --ev-amber-fg: #8a5a12;  --ev-amber-border: #f2ddb3;
  --ev-slate-bg: #eef1f5;  --ev-slate-fg: #3f4a5a;  --ev-slate-border: #cdd5e0;
  --ev-rose-bg: #fdecec;   --ev-rose-fg: #99333a;   --ev-rose-border: #f2c4c6;
}
/* dark 側は既存 dark ブロックに、暗背景・淡文字で同キーを定義（コントラスト確保） */
```
（dark の具体値は既存 dark トークンのトーンに合わせ、`--ev-*-bg` は暗め・`--ev-*-fg` は明るめにする。）

- [ ] **Step 2: 解決関数**

`src/components/eventColors.ts`:
```ts
import type { EventColorKey } from "@/domain/event";

export const EVENT_COLOR_KEYS: readonly EventColorKey[] = [
  "blue", "green", "teal", "purple", "pink", "amber", "slate", "rose",
];

export function eventColor(key: EventColorKey): {
  readonly bg: string; readonly fg: string; readonly border: string;
} {
  return {
    bg: `var(--ev-${key}-bg)`,
    fg: `var(--ev-${key}-fg)`,
    border: `var(--ev-${key}-border)`,
  };
}
```

- [ ] **Step 3: 検証** — Run: `npx next build` → ビルド成功（CSSにトークンが含まれる）。

- [ ] **Step 4: コミット**
```bash
git add src/app/globals.css src/components/eventColors.ts
git commit -m "feat: イベント8色パレットのトークンと解決関数を追加する"
```

---

## Task 8: L3 日ビューのイベント表示（終日行＋時刻グリッド横並び）

**Files:**
- Create: `src/components/DayTimedEvents.tsx`
- Modify: `src/components/DayView.tsx`
- Modify: `src/components/CalendarApp.tsx`（`EventProvider` でアプリをラップ）

**Interfaces:**
- Consumes: `useEvents`, `eventsForDay`, `clipEventToDay`, `layoutDayColumns`, `eventColor`, `sortForDay`。
- Produces: `DayTimedEvents({ date, hourHeight })` — 時刻グリッドに重なり配置のイベント層を描画。

- [ ] **Step 1: アプリを EventProvider でラップ**

`src/components/CalendarApp.tsx`：`CalendarApp` の return 全体を `<EventProvider>…</EventProvider>` で包む（最上位で1回）。`import { EventProvider } from "@/hooks/useEvents";`。

- [ ] **Step 2: 時刻グリッドのイベント層**

`src/components/DayTimedEvents.tsx`（`useEvents` から当日を抽出→`clipEventToDay`→`layoutDayColumns`→絶対配置）:
```tsx
"use client";
import { useEvents } from "@/hooks/useEvents";
import { clipEventToDay, eventsForDay, layoutDayColumns, type DaySegment } from "@/domain/event";
import { eventColor } from "@/components/eventColors";
import type { CivilDate } from "@/domain/shared/date";

export function DayTimedEvents({ date, hourHeight }: { readonly date: CivilDate; readonly hourHeight: number }) {
  const { events } = useEvents();
  const segments: DaySegment[] = eventsForDay(events, date)
    .map((e) => clipEventToDay(e, date))
    .filter((s): s is DaySegment => s !== null);
  const laid = layoutDayColumns(segments);
  return (
    <>
      {laid.map((s) => {
        const c = eventColor(s.event.colorKey);
        const top = (s.startMin / 60) * hourHeight;
        const height = Math.max(((s.endMin - s.startMin) / 60) * hourHeight, 14);
        const widthPct = 100 / s.columnCount;
        return (
          <button
            key={s.event.id}
            type="button"
            className="absolute overflow-hidden rounded px-1 text-left text-[11px] leading-tight"
            style={{
              top, height,
              left: `calc(3.5rem + ${s.columnIndex} * (100% - 3.5rem) * ${widthPct / 100})`,
              width: `calc((100% - 3.5rem) * ${widthPct / 100} - 2px)`,
              background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
            }}
            data-event-id={s.event.id}
            aria-label={`${s.event.title} を編集`}
          >
            {s.continuesFromPrev ? "‹ " : ""}{s.event.title}{s.continuesToNext ? " ›" : ""}
          </button>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: DayView に差し込み**

`src/components/DayView.tsx`：時間グリッド本体（`ref={bodyRef}` の相対配置コンテナ）内に `<DayTimedEvents date={{year, month, day}} hourHeight={HOUR_HEIGHT} />` を、今ラインと同じ絶対配置レイヤとして追加。終日行には当日の `allDay` イベントを `eventsForDay` で抽出しチップ表示（`EventChip` は Task10 で作るので、暫定は簡易 span でも可・後で差し替え）。

- [ ] **Step 4: 配信して実機確認（Playwright）**

`npx next build` → 配信 → Playwright で `localStorage.setItem("tonihaya.events", …)` に時間イベント2件（重なり）を注入しリロード → L3（`?y=…&v=day`）で**横並び2列**・複数日の継続印を目視。DOM で `[data-event-id]` の `left/width` が列に応じて分割されるか確認。

- [ ] **Step 5: 3点セット＋コミット**
```bash
npx vitest run && npx tsc --noEmit && npx next build
git add src/components/DayTimedEvents.tsx src/components/DayView.tsx src/components/CalendarApp.tsx
git commit -m "feat: L3日ビューに時間イベントの横並び表示を追加する"
```

---

## Task 9: L2 週ビューのイベント表示

**Files:**
- Modify: `src/components/WeekView.tsx`

**Interfaces:**
- Consumes: `DayTimedEvents`（各日カラムに再利用可能なら流用、幅計算は週の1日分に調整）、`useEvents`, `eventsForDay`, `eventColor`。

- [ ] **Step 1: 終日/複数日行**

WeekView の「終日」行に、各日 `eventsForDay(events, day).filter(e => e.allDay)` を抽出しチップ表示（範囲の各日に出る＝B方式）。

- [ ] **Step 2: 時刻グリッドの時間イベント**

各日カラムに時間イベントを配置。日単位に `clipEventToDay`＋`layoutDayColumns` を適用し、カラム幅内で横並び。`DayTimedEvents` を「1日カラム幅・オフセット」対応にリファクタして流用するか、週用の薄いラッパを作る。

- [ ] **Step 3: 実機確認（Playwright）**

複数日イベント（終日/時間）が週内の該当各日に出るか、重なりが横並びするかを目視＋DOM検証。

- [ ] **Step 4: 3点セット＋コミット**
```bash
npx vitest run && npx tsc --noEmit && npx next build
git add src/components/WeekView.tsx
git commit -m "feat: L2週ビューにイベント表示を追加する"
```

---

## Task 10: L1 月ビューのチップ表示（+N件）

**Files:**
- Create: `src/components/EventChip.tsx`
- Modify: `src/components/MonthDetail.tsx`, `src/components/MonthCard.tsx`

**Interfaces:**
- Produces: `EventChip({ event, compact })` — `● タイトル`（時間イベントは時刻付き）を色付きで描画。

- [ ] **Step 1: EventChip**

`src/components/EventChip.tsx`：`eventColor` で色付け、`compact` で高さ抑制。時間イベントは `HH:MM タイトル`、終日は `● タイトル`。

- [ ] **Step 2: MonthCard 日セルに差し込み**

L1（`size="lg"`）の各日セル下部に、その日の `eventsForDay`→`sortForDay` を **最大3件** `EventChip` で表示、超過は「+N件」。L0（`size="sm"`）は Task11 で点表示にするためここでは出さない（`showEvents` prop 等で分岐）。`useEvents` は MonthDetail で取得し MonthCard へ配列を渡す（MonthCard は純粋描画を保つ）。

- [ ] **Step 3: 実機確認** — L1 で各日にチップ・4件以上で「+N件」。

- [ ] **Step 4: 3点セット＋コミット**
```bash
npx vitest run && npx tsc --noEmit && npx next build
git add src/components/EventChip.tsx src/components/MonthDetail.tsx src/components/MonthCard.tsx
git commit -m "feat: L1月ビューにイベントチップと+N件表示を追加する"
```

---

## Task 11: L0 俯瞰のインジケータ

**Files:**
- Modify: `src/components/OverviewBody.tsx`, `src/components/MonthCard.tsx`

- [ ] **Step 1: 点インジケータ**

L0（`size="sm"`）の各日セルに、その日イベントがあれば小さな点（最大3・イベント色）を表示。`OverviewBody` で `useEvents` を取得し各 `MonthCard` に配列を渡す。

- [ ] **Step 2: 実機確認＋パフォーマンス** — 12ヶ月×多数イベントでも描画が軽いか（点のみ・純関数フィルタ）。

- [ ] **Step 3: 3点セット＋コミット**
```bash
npx vitest run && npx tsc --noEmit && npx next build
git add src/components/OverviewBody.tsx src/components/MonthCard.tsx
git commit -m "feat: L0俯瞰にイベントのインジケータを追加する"
```

---

## Task 12: 作成・編集・削除 UI（モーダル）

**Files:**
- Create: `src/components/EventModal.tsx`
- Modify: `src/components/CalendarApp.tsx`（開閉状態・トリガー配線）, 各ビュー（クリックで開く配線）

**Interfaces:**
- Consumes: `useEvents`（add/update/remove）, `validateEvent`, `isSafeUrl`, `EVENT_COLOR_KEYS`, `eventColor`。
- Produces: `EventModal({ open, initial, onClose })` — 新規/編集フォーム。

- [ ] **Step 1: モーダル本体**

`src/components/EventModal.tsx`：入力＝タイトル / 終日トグル / 日付範囲（開始・終了）/ 時刻（終日OFF時）/ 色8択（`EVENT_COLOR_KEYS`）/ 優先度 / URL / 備考。保存時 `validateEvent`→エラー表示 or `addEvent`/`updateEvent`。編集時は削除ボタン（確認あり）。フォーカストラップ・Escで閉じる・`role="dialog"`・`aria-modal`。

- [ ] **Step 2: 作成トリガー配線**

- 各ビューのナビに「＋ 予定」ボタン → 空フォームで open。
- L1 日セルクリック → その日で新規（終日デフォルト）。※既存の日クリック（ドリル）と競合しないよう、イベント作成は「＋」または長押し/専用領域に割り当て、日セル本来のドリルは維持（衝突回避方針を明記）。
- L2/L3 時刻スロットクリック → その時刻で新規（時間）。

- [ ] **Step 3: 編集/削除導線**

イベント要素（`[data-event-id]` / `EventChip`）クリック → 該当イベントで編集モードの `EventModal` を open。

- [ ] **Step 4: 実機E2E（Playwright）**

作成→L0〜L3表示→編集→削除の一連。リロードで保持。URL に `javascript:` を入れて弾かれること。バリデーション（空タイトル・時刻逆転）。

- [ ] **Step 5: 3点セット＋コミット**
```bash
npx vitest run && npx tsc --noEmit && npx next build
git add -A
git commit -m "feat: イベントの作成・編集・削除モーダルを追加する"
```

---

## Task 13: 仕上げ（E2E総合・回帰・progress）

**Files:** なし（検証中心。不具合時のみ修正）。

- [ ] **Step 1: 総合E2E**

新規（終日単日／終日複数日／時間単日／時間複数日）を作成し、L0点・L1チップ/+N・L2週・L3横並びが全て正しいか。重なり横並び、継続印、色8種、URLリンクの安全描画を確認。

- [ ] **Step 2: 回帰**

既存ズーム遷移（L1↔L2 等）がイベント要素で壊れていないか（イベントに `view-transition-name` を付けていないこと）。設定・レベルジャンプ不変。

- [ ] **Step 3: 最終3点セット＋First Load**

Run: `npx vitest run && npx tsc --noEmit && npx next build`
Expected: 全緑・First Load < 150KB。

- [ ] **Step 4: progress.md 追記**

`.superpowers/sdd/progress.md` にイベントMVPの各タスク commit と E2E結果を追記。

---

## Self-Review

- **Spec coverage:** §2モデル→T1-4。§3永続化→T5。§4ドメイン→T1-4。§5注入→T6。§6色→T7。§7表示 L0-L3→T8/9/10/11。§8作成編集削除UI→T12。§9セキュリティ(URL)→T4(isSafeUrl)+T12。§10テスト→各T＋T13。§11受け入れ基準→T13で総点検。§12スコープ外→非対応（明記）。
- **Placeholder scan:** ドメイン/リポジトリ/状態/色は実コード。UI（T8-12）は既存コンポーネント様式に倣う統合指示＋Playwright検証で、曖昧語なし。T3のレイアウトは実装コードあり。
- **Type consistency:** `CalendarEvent`/`EventPoint`/`EventColorKey`/`EventPriority`（T1）、`DaySegment`（T2）、`LaidOutSegment`（T3）、`EventDraft`（T4）、`EventRepository`（T5）、`useEvents` 戻り値（T6）、`eventColor`（T7）を各タスクで一貫使用。`crypto.randomUUID()`・`Date.now()` は T6 で id/timestamps 生成（ドメインは純粋に保つ）。
