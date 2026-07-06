# レベルジャンプ（年/月/週/日切替）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ズーム階層の任意レベル（年/月/週/日）へ1クリックで飛べる「レベル切替セグメント」を全ビューの nav に常設する。

**Architecture:** ジャンプ先の解決を純関数 `resolveJumpTarget`（文脈保持＋today補完＋日クランプ）に、UIを共有部品 `LevelSwitcher` に切り出し、`CalendarApp` に `jumpTo(level)`（pivot掃除→navigate）を置く。各ビューは新規 prop `onJump` を受け、自分のレベルを `current` として `LevelSwitcher` に渡す。

**Tech Stack:** Next.js(App Router) / React 19(useState, flushSync) / TypeScript / Tailwind v4 / Vitest。

## Global Constraints

- コミット: `type: 日本語説明`（命令形・先頭小文字の英語型名・末尾ピリオドなし）、**`Co-Authored-By` なし**、1意味単位=1コミット。ブランチは `feature`。
- `npm run dev` はフックでブロック。検証は `npx next build`。静的確認は `python3 -m http.server 4599 --directory out`。Bash作業ディレクトリは持続するため `cd out` しない方式で配信する。
- 検証3点セット: `npx vitest run && npx tsc --noEmit && npx next build`。First Load JS < 150KB を維持。
- 色は必ず既存CSSトークン経由（`--surface` / `--border` / `--border-strong` / `--text` / `--today-bg` / `--today-fg` / `--text-muted` 等）。ハードコード色禁止。
- ズーム状態型: `ZoomState { level:"overview"|"month"|"week"|"day"; year; month?; day? }`（`src/domain/view/zoom.ts`）。
- 既存パターン: nav ボタンは `rounded-md border px-… py-1 text-… transition-opacity hover:opacity-70`＋トークン。active表現は `LayoutButton`（`OverviewBody.tsx:117`）に倣う（`font-bold`＋`--border-strong`＋`background:--surface`、非activeは `opacity-60 hover:opacity-100`）。

---

## File Structure

- **Modify** `src/domain/shared/date.ts` — `daysInMonth(year, month)` を追加（月の日数）。
- **Modify** `src/domain/shared/date.test.ts` — `daysInMonth` のテスト。
- **Create** `src/domain/view/jumpTarget.ts` — `resolveJumpTarget` 純関数。
- **Create** `src/domain/view/jumpTarget.test.ts` — テスト。
- **Modify** `src/domain/view/index.ts` — `resolveJumpTarget` / `JumpLevel` を再エクスポート。
- **Create** `src/components/LevelSwitcher.tsx` — 年/月/週/日セグメントUI。
- **Modify** `src/components/CalendarApp.tsx` — `jumpTo` 追加、4ビューへ `onJump` 配線。
- **Modify** `src/components/MonthDetail.tsx` — nav に `LevelSwitcher`、prop `onJump`。
- **Modify** `src/components/WeekView.tsx` — nav に `LevelSwitcher`、prop `onJump`。
- **Modify** `src/components/DayView.tsx` — nav に `LevelSwitcher`、prop `onJump`。
- **Modify** `src/components/OverviewBody.tsx` — nav に `LevelSwitcher`（レイアウト切替の左隣）、prop `onJump`。

---

## Task 1: ドメイン（`daysInMonth` ＋ `resolveJumpTarget`）

**Files:**
- Modify: `src/domain/shared/date.ts`
- Test: `src/domain/shared/date.test.ts`
- Create: `src/domain/view/jumpTarget.ts`
- Test: `src/domain/view/jumpTarget.test.ts`
- Modify: `src/domain/view/index.ts`

**Interfaces:**
- Consumes: `ZoomState`（`./zoom`）。
- Produces:
  - `daysInMonth(year: number, month: number): number`（`../shared/date`）
  - `type JumpLevel = "overview" | "month" | "week" | "day"`
  - `resolveJumpTarget(target: JumpLevel, zoom: ZoomState, today: CivilDate | null): ZoomState`
  - `CivilDate = { readonly year: number; readonly month: number; readonly day: number }`

- [ ] **Step 1: `daysInMonth` の失敗するテストを書く**

`src/domain/shared/date.test.ts` に追記（既存の describe とは別に追加。ファイル冒頭の import に `daysInMonth` を加える）:
```typescript
import { daysInMonth } from "./date";

describe("daysInMonth", () => {
  test("各月の日数", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28); // 平年
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
  test("うるう年の2月", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29); // 400で割れる
    expect(daysInMonth(1900, 2)).toBe(28); // 100で割れて400で割れない
  });
});
```
※既存 `date.test.ts` に `import { describe, expect, test } from "vitest";` と他関数の import がある前提。無ければ先頭に追加する。

- [ ] **Step 2: 失敗を確認**

Run: `npx vitest run src/domain/shared/date.test.ts`
Expected: FAIL（`daysInMonth is not a function`）

- [ ] **Step 3: `daysInMonth` を実装**

`src/domain/shared/date.ts` の末尾に追記:
```typescript
/** 指定した年月の日数（翌月0日=当月末日をUTC基準で算出）。 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
```

- [ ] **Step 4: 通過を確認**

Run: `npx vitest run src/domain/shared/date.test.ts`
Expected: PASS

- [ ] **Step 5: `resolveJumpTarget` の失敗するテストを書く**

`src/domain/view/jumpTarget.test.ts`:
```typescript
import { describe, expect, test } from "vitest";
import { resolveJumpTarget } from "./jumpTarget";
import type { ZoomState } from "./zoom";

const TODAY = { year: 2026, month: 7, day: 5 };

describe("resolveJumpTarget", () => {
  test("overviewへ: yearのみ保持", () => {
    const zoom: ZoomState = { level: "day", year: 2030, month: 3, day: 15 };
    expect(resolveJumpTarget("overview", zoom, TODAY)).toEqual({ level: "overview", year: 2030 });
  });

  test("L0(年のみ)からdayへ: month/dayをtodayで補完", () => {
    const zoom: ZoomState = { level: "overview", year: 2026 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day", year: 2026, month: 7, day: 5,
    });
  });

  test("L1(月あり)からdayへ: monthは保持しdayはtodayで補完", () => {
    const zoom: ZoomState = { level: "month", year: 2026, month: 3 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day", year: 2026, month: 3, day: 5,
    });
  });

  test("monthへ: dayは落とす", () => {
    const zoom: ZoomState = { level: "week", year: 2026, month: 8, day: 20 };
    expect(resolveJumpTarget("month", zoom, TODAY)).toEqual({ level: "month", year: 2026, month: 8 });
  });

  test("weekへ: 文脈のday保持", () => {
    const zoom: ZoomState = { level: "day", year: 2026, month: 8, day: 20 };
    expect(resolveJumpTarget("week", zoom, TODAY)).toEqual({
      level: "week", year: 2026, month: 8, day: 20,
    });
  });

  test("日のクランプ: today.day=31 で2月なら28に丸める", () => {
    const zoom: ZoomState = { level: "month", year: 2026, month: 2 };
    const t = { year: 2026, month: 12, day: 31 };
    expect(resolveJumpTarget("day", zoom, t)).toEqual({
      level: "day", year: 2026, month: 2, day: 28,
    });
  });

  test("today=null: month=1, day=1 にフォールバック", () => {
    const zoom: ZoomState = { level: "overview", year: 2026 };
    expect(resolveJumpTarget("day", zoom, null)).toEqual({
      level: "day", year: 2026, month: 1, day: 1,
    });
  });
});
```

- [ ] **Step 6: 失敗を確認**

Run: `npx vitest run src/domain/view/jumpTarget.test.ts`
Expected: FAIL（`Failed to resolve import "./jumpTarget"`）

- [ ] **Step 7: `resolveJumpTarget` を実装**

`src/domain/view/jumpTarget.ts`:
```typescript
import { daysInMonth } from "../shared/date";
import type { ZoomState } from "./zoom";

export type JumpLevel = "overview" | "month" | "week" | "day";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/**
 * ジャンプ先のズーム状態を決める。今ある文脈(year/month/day)は保持し、
 * 足りない細かいフィールドは today で補完する。day は対象月の日数でクランプ。
 * today=null のときは month=1 / day=1 にフォールバック。
 */
export function resolveJumpTarget(
  target: JumpLevel,
  zoom: ZoomState,
  today: CivilDate | null,
): ZoomState {
  const year = zoom.year;
  if (target === "overview") {
    return { level: "overview", year };
  }

  const month = zoom.month ?? today?.month ?? 1;
  if (target === "month") {
    return { level: "month", year, month };
  }

  const rawDay = zoom.day ?? today?.day ?? 1;
  const day = Math.min(rawDay, daysInMonth(year, month));
  return { level: target, year, month, day };
}
```

- [ ] **Step 8: 通過を確認**

Run: `npx vitest run src/domain/view/jumpTarget.test.ts`
Expected: PASS（7 tests）

- [ ] **Step 9: index.ts に再エクスポート**

`src/domain/view/index.ts` の末尾に追記:
```typescript
export { resolveJumpTarget } from "./jumpTarget";
export type { JumpLevel } from "./jumpTarget";
```

- [ ] **Step 10: 型チェックとコミット**

Run: `npx tsc --noEmit`
Expected: エラーなし
```bash
git add src/domain/shared/date.ts src/domain/shared/date.test.ts src/domain/view/jumpTarget.ts src/domain/view/jumpTarget.test.ts src/domain/view/index.ts
git commit -m "feat: レベルジャンプ先を解決するresolveJumpTargetとdaysInMonthを追加"
```

---

## Task 2: `LevelSwitcher` コンポーネント

**Files:**
- Create: `src/components/LevelSwitcher.tsx`

**Interfaces:**
- Consumes: `JumpLevel`（`@/domain/view`）。
- Produces:
  - `LevelSwitcher` コンポーネント。props:
    ```typescript
    {
      current: JumpLevel;
      onJump: (level: JumpLevel) => void;
    }
    ```

**注記:** このタスクでは画面未組込（Task3/4で配線）。deliverable は型が通る `LevelSwitcher.tsx`。単体テストは付けない（純粋描画）。

- [ ] **Step 1: 実装**

`src/components/LevelSwitcher.tsx`:
```tsx
"use client";

import type { JumpLevel } from "@/domain/view";

const LEVELS: readonly { level: JumpLevel; label: string }[] = [
  { level: "overview", label: "年" },
  { level: "month", label: "月" },
  { level: "week", label: "週" },
  { level: "day", label: "日" },
];

/** 年/月/週/日を1クリックで切り替えるセグメント。現在レベルはactive＋disabled。 */
export function LevelSwitcher({
  current,
  onJump,
}: {
  readonly current: JumpLevel;
  readonly onJump: (level: JumpLevel) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="表示レベルの切替">
      {LEVELS.map(({ level, label }) => {
        const active = level === current;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onJump(level)}
            disabled={active}
            aria-pressed={active}
            className={`rounded-md border px-2 py-1 text-xs tabular-nums transition-opacity ${
              active ? "cursor-default font-bold" : "opacity-60 hover:opacity-100"
            }`}
            style={{
              borderColor: active ? "var(--border-strong)" : "var(--border)",
              color: "var(--text)",
              background: active ? "var(--surface)" : "transparent",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 型チェックとコミット**

Run: `npx tsc --noEmit`
Expected: エラーなし
```bash
git add src/components/LevelSwitcher.tsx
git commit -m "feat: 年/月/週/日を切り替えるLevelSwitcherコンポーネントを追加"
```

---

## Task 3: CalendarApp の `jumpTo` ＋ L1/L2/L3 nav へ配線

**Files:**
- Modify: `src/components/CalendarApp.tsx`
- Modify: `src/components/MonthDetail.tsx`
- Modify: `src/components/WeekView.tsx`
- Modify: `src/components/DayView.tsx`

**Interfaces:**
- Consumes: `resolveJumpTarget`, `JumpLevel`（`@/domain/view`）、`LevelSwitcher`（`@/components/LevelSwitcher`）、`flushSync`（既存 import）。
- Produces:
  - `MonthDetail` / `WeekView` / `DayView` に新規 prop `onJump: (level: JumpLevel) => void`。
  - `CalendarApp` の `jumpTo(level: JumpLevel)`。

- [ ] **Step 1: CalendarApp に import と jumpTo を追加**

`src/components/CalendarApp.tsx` の import に追加:
```tsx
import { clampYear, resolveJumpTarget, type JumpLevel } from "@/domain/view";
import { LevelSwitcher } from "@/components/LevelSwitcher";
```
（既存の `import { clampYear } from "@/domain/view";` は上の行に統合し、重複させないこと。）

`dayPivot` 定義付近（`openDay` の下）に `jumpTo` を追加:
```tsx
  // 年/月/週/日セグメントからの直接ジャンプ。隣接レベル用の共有要素が非隣接
  // ジャンプで取り残されないよう、両ピボットを掃除してから遷移する。
  const jumpTo = (level: JumpLevel): void => {
    flushSync(() => {
      setPivotDay(null);
      setDayPivot(null);
    });
    navigate(resolveJumpTarget(level, zoom, today), "push");
  };
```

- [ ] **Step 2: MonthDetail に onJump prop と LevelSwitcher を追加**

`src/components/MonthDetail.tsx`:
- 冒頭に `import { LevelSwitcher } from "@/components/LevelSwitcher";` と `import type { JumpLevel } from "@/domain/view";` を追加。
- props 型に追加（`onDayClick` の下）:
```tsx
  readonly onDayClick: (year: number, month: number, day: number) => void;
  readonly onJump: (level: JumpLevel) => void;
```
- 分割代入に `onJump` を追加。
- `<nav className="mb-5 flex min-h-10 items-center gap-2">` の**末尾**（閉じ `</nav>` の直前、既存の月送りボタン群の後）に追加:
```tsx
        <div className="ml-auto">
          <LevelSwitcher current="month" onJump={onJump} />
        </div>
```

- [ ] **Step 3: WeekView に onJump prop と LevelSwitcher を追加**

`src/components/WeekView.tsx`:
- 冒頭に `import { LevelSwitcher } from "@/components/LevelSwitcher";` と `import type { JumpLevel } from "@/domain/view";` を追加。
- props 型に追加（`dayPivot` の下）:
```tsx
  readonly dayPivot: { readonly year: number; readonly month: number; readonly day: number } | null;
  readonly onJump: (level: JumpLevel) => void;
```
- 分割代入に `onJump` を追加。
- 週ナビの `<nav className="mb-5 flex min-h-10 shrink-0 items-center gap-2">` の末尾（閉じ `</nav>` 直前）に追加:
```tsx
        <div className="ml-auto">
          <LevelSwitcher current="week" onJump={onJump} />
        </div>
```

- [ ] **Step 4: DayView に onJump prop と LevelSwitcher を追加**

`src/components/DayView.tsx`:
- 冒頭に `import { LevelSwitcher } from "@/components/LevelSwitcher";` と `import type { JumpLevel } from "@/domain/view";` を追加。
- props 型に追加（`onDayChange` の下）:
```tsx
  readonly onDayChange: (year: number, month: number, day: number) => void;
  readonly onJump: (level: JumpLevel) => void;
```
- 分割代入に `onJump` を追加。
- 日ナビの `<nav className="mb-5 flex min-h-10 shrink-0 items-center gap-2">` の末尾（閉じ `</nav>` 直前）に追加:
```tsx
        <div className="ml-auto">
          <LevelSwitcher current="day" onJump={onJump} />
        </div>
```

- [ ] **Step 5: CalendarApp で各ビューに onJump を配線**

`src/components/CalendarApp.tsx` の各分岐の JSX に `onJump={jumpTo}` を追加:
- day 分岐の `<DayView …>` に `onJump={jumpTo}`
- week 分岐の `<WeekView …>` に `onJump={jumpTo}`
- month（L1）分岐の `<MonthDetail …>` に `onJump={jumpTo}`

- [ ] **Step 6: 検証3点セット**

Run: `npx tsc --noEmit && npx vitest run && npx next build`
Expected: 型エラーなし、全テスト緑、ビルド成功、First Load < 150KB。

- [ ] **Step 7: コミット**

```bash
git add src/components/CalendarApp.tsx src/components/MonthDetail.tsx src/components/WeekView.tsx src/components/DayView.tsx
git commit -m "feat: L1/L2/L3のnavにレベル切替を追加しjumpToで直接ジャンプ可能にする"
```

---

## Task 4: L0（OverviewBody）へ配線（レイアウト切替の左隣）

**Files:**
- Modify: `src/components/OverviewBody.tsx`
- Modify: `src/components/CalendarApp.tsx`

**Interfaces:**
- Consumes: `LevelSwitcher`（`@/components/LevelSwitcher`）、`JumpLevel`（`@/domain/view`）、`jumpTo`（CalendarApp、Task3で定義済み）。
- Produces: `OverviewBody` に新規 prop `onJump: (level: JumpLevel) => void`。

- [ ] **Step 1: OverviewBody に import と prop を追加**

`src/components/OverviewBody.tsx`:
- 冒頭に `import { LevelSwitcher } from "@/components/LevelSwitcher";` と `import type { JumpLevel } from "@/domain/view";` を追加。
- props 型に追加（`onLayoutChange` の下）:
```tsx
  readonly onLayoutChange: (layout: OverviewLayout) => void;
  readonly onJump: (level: JumpLevel) => void;
```
- 分割代入に `onJump` を追加。

- [ ] **Step 2: レイアウト切替の左隣に LevelSwitcher を置く**

`src/components/OverviewBody.tsx` の nav 内、既存のレイアウト切替 div を次の構造に置換する（`LevelSwitcher` を `ml-auto` にし、レイアウト切替 div からは `ml-auto` を外して右クラスタに並べる）:
```tsx
        {/* 右クラスタ: レベル切替（常時）＋レイアウト切替（≥1288pxのみ） */}
        <div className="ml-auto flex items-center gap-2">
          <LevelSwitcher current="overview" onJump={onJump} />
          <div className="hidden items-center gap-1 min-[1288px]:flex">
            <span className="mr-1 text-[11px]" style={{ color: "var(--text-muted)" }}>表示</span>
            <LayoutButton label="3×4" active={layout === "3x4"} onClick={() => onLayoutChange("3x4")} />
            <LayoutButton label="4×3" active={layout === "4x3"} onClick={() => onLayoutChange("4x3")} />
          </div>
        </div>
```

- [ ] **Step 3: CalendarApp で OverviewBody に onJump を配線**

`src/components/CalendarApp.tsx` の overview 分岐の `<OverviewBody …>` に `onJump={jumpTo}` を追加。

- [ ] **Step 4: 検証3点セット**

Run: `npx tsc --noEmit && npx vitest run && npx next build`
Expected: 型エラーなし、全テスト緑、ビルド成功、First Load < 150KB。

- [ ] **Step 5: コミット**

```bash
git add src/components/OverviewBody.tsx src/components/CalendarApp.tsx
git commit -m "feat: L0俯瞰navのレイアウト切替左にレベル切替を追加する"
```

---

## Task 5: 実機E2E検証（Playwright MCP）

**Files:** なし（検証のみ）。不具合時のみ修正し追加コミット。

**前提:** `npx next build` 済み。`python3 -m http.server 4599 --directory out` で配信（`cd` しない）。

- [ ] **Step 1: 配信**

```bash
python3 -m http.server 4599 --directory out
```

- [ ] **Step 2: 全レベルにセグメントが出るか**

各URLを開き、nav に「年/月/週/日」4ボタンが出て、現在レベルが active（`aria-pressed=true`・disabled）であることを確認:
- `/?y=2026`（overview→「年」active）
- `/?y=2026&m=7`（month→「月」active）
- `/?y=2026&m=7&d=15&v=week`（week→「週」active）
- `/?y=2026&m=7&d=15&v=day`（day→「日」active）

- [ ] **Step 3: 任意レベル→任意レベルのジャンプ**

L0（`/?y=2026`）で「日」→ URL `?y=2026&m=7&d=5&v=day`（today補完）。
L3（`/?y=2026&m=3&d=15&v=day`）で「年」→ `?y=2026`。
L1（`/?y=2026&m=3`）で「日」→ `?y=2026&m=3&d=5&v=day`（month=3保持・day=today補完）。
L2→「月」、L0→「週」等も確認。

- [ ] **Step 4: today補完・クランプ・文脈保持の確認**

`/?y=2026&m=2`（2月）で「日」→ today.day=5 なので `d=5`（クランプ不要ケース）。
※クランプ（2/31→2/28）はドメインテスト済みだが、実機でも2月表示から「日」で無効日にならないこと（URLの `d` が28以下）を確認。

- [ ] **Step 5: ジャンプ後に隣接ズームが壊れないこと**

L0→「日」でL3へジャンプ後、L3の `‹戻る` で週へ、さらに月・俯瞰へ戻り、改めて L1→日クリック→L2→L3 の**隣接ズームモーフ**が正常（`getComputedStyle` で `day-zoom`/`hour-zoom` が期待通り）に動くことを確認。pivot掃除が効いて古い共有要素が残っていないこと。

- [ ] **Step 6: L0配置の確認**

L0（`/?y=2026`）で、レベル切替が右クラスタのレイアウト切替（≥1288px時）の**左隣**に並ぶこと。狭幅（<1288px）ではレイアウト切替が消え、レベル切替は残ること。

- [ ] **Step 7: サーバ停止と最終3点セット**

```bash
pkill -f "http.server 4599"
npx vitest run && npx tsc --noEmit && npx next build
```
Expected: 全緑・ビルド成功・First Load < 150KB。

- [ ] **Step 8: progress.md 更新**

`.superpowers/sdd/progress.md` にレベルジャンプのセクションを追記（各タスクの commit と E2E結果）。

---

## Self-Review

- **Spec coverage:** §2 resolveJumpTarget→Task1。§3 LevelSwitcher→Task2。§4 配置(全nav/ L0左隣)→Task3(L1/L2/L3)・Task4(L0)。§5 jumpTo/ pivot掃除→Task3 Step1。§6 配線→Task3/4。§7テスト→Task1(単体)/Task5(実機)。§8受け入れ基準→全項目タスク対応あり。
- **Placeholder scan:** コードは全て実体。曖昧な「適切に」等なし。
- **Type consistency:** `JumpLevel`＝`"overview"|"month"|"week"|"day"`、`resolveJumpTarget(target, zoom, today)`、`onJump:(level:JumpLevel)=>void`、`jumpTo(level)`、`daysInMonth(year,month)` は Task1〜4 で一貫。`LevelSwitcher` props `current`/`onJump` 一貫。`current` はビュー毎に固定文字列（overview/month/week/day）。
