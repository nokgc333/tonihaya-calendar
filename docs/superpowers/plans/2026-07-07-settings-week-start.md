# 設定パネル（週開始）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全レベルの nav に歯車アイコン→設定ポップオーバーを常設し、週開始（日/月）を localStorage 永続で切り替え、L0/L1/L2 に一貫反映する。

**Architecture:** 週開始のドメインは既存（`WeekStart` 型と各 build 関数が対応済み）。UIは共有部品 `SettingsMenu`（歯車＋ポップオーバー）を新設し、`CalendarApp` が `weekStart` 状態を既存 `overviewLayout` と同じ localStorage パターンで持ち、全ビューへ配る。各ビューはハードコード `"sun"` を `weekStart` に差し替え、nav に `SettingsMenu` を LevelSwitcher の左へ描画する。

**Tech Stack:** Next.js(App Router) / React 19(useState/useEffect/useRef) / TypeScript / Tailwind v4。

## Global Constraints

- コミット: `type: 日本語説明`（命令形・先頭小文字の英語型名・末尾ピリオドなし）、**`Co-Authored-By` なし**、1意味単位=1コミット。タスク毎に `develop` から個別トピックブランチを切り `--no-ff` で develop へ戻す（実行スキル側で対応）。
- `npm run dev` はフックでブロック。検証は `npx next build`。静的確認は `python3 -m http.server 4599 --directory out`（`cd` しない）。
- 検証3点セット: `npx vitest run && npx tsc --noEmit && npx next build`。First Load JS < 150KB を維持。既存テスト数 116（本機能でテスト追加なし・全緑維持）。
- 色は必ず既存CSSトークン経由（`--surface` / `--surface-2` / `--border` / `--text` / `--text-muted` 等）。ハードコード色禁止。
- `WeekStart = "sun" | "mon"`（`@/domain/calendar` からエクスポート）。日曜/月曜のみ（土曜は対象外）。
- 週開始の永続化は既存 `overviewLayout` パターンに倣う（localStorage キー `tonihaya.weekStart`・既定 `"sun"`・`useEffect` 読込・変更時 `setItem`）。
- 配置: 歯車は各 nav 右クラスタで **LevelSwitcher の左隣**（LevelSwitcher は右端維持）。

---

## File Structure

- **Create** `src/components/SettingsMenu.tsx` — 歯車ボタン＋設定ポップオーバー（週開始トグル、外側クリック/Escで閉じる）。
- **Modify** `src/components/CalendarApp.tsx` — `weekStart` 状態＋localStorage永続化、全ビューへ配線。
- **Modify** `src/components/MonthDetail.tsx` / `WeekView.tsx` / `DayView.tsx` — `weekStart`/`onWeekStartChange` prop、nav に `SettingsMenu`、build 呼び出しへ `weekStart`。
- **Modify** `src/components/OverviewBody.tsx` — 同上（右クラスタのレイアウト切替と LevelSwitcher の間に `SettingsMenu`）。

---

## Task 1: `SettingsMenu` コンポーネント

**Files:**
- Create: `src/components/SettingsMenu.tsx`

**Interfaces:**
- Consumes: `WeekStart`（`@/domain/calendar`）、`SegmentButton`（`@/components/SegmentButton`）。
- Produces:
  - `SettingsMenu` コンポーネント。props: `{ weekStart: WeekStart; onWeekStartChange: (weekStart: WeekStart) => void }`

**注記:** このタスクは新規ファイルのみ・画面未組込（配線は Task2/3）。単体テストなし（純描画）。deliverable は型が通る `SettingsMenu.tsx`。

- [ ] **Step 1: 実装**

`src/components/SettingsMenu.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { WeekStart } from "@/domain/calendar";
import { SegmentButton } from "@/components/SegmentButton";

/** 歯車→設定ポップオーバー。現状は週開始(日/月)のみ。外側クリック/Escで閉じる。 */
export function SettingsMenu({
  weekStart,
  onWeekStartChange,
}: {
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="設定"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="設定"
          className="absolute right-0 z-20 mt-1 rounded-lg border p-3 shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <div className="mb-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            週開始
          </div>
          <div className="flex items-center gap-1">
            <SegmentButton
              label="日"
              active={weekStart === "sun"}
              onClick={() => onWeekStartChange("sun")}
              aria-current={weekStart === "sun" ? "true" : undefined}
            />
            <SegmentButton
              label="月"
              active={weekStart === "mon"}
              onClick={() => onWeekStartChange("mon")}
              aria-current={weekStart === "mon" ? "true" : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 型チェックとコミット**

Run: `npx tsc --noEmit`
Expected: エラーなし
```bash
git add src/components/SettingsMenu.tsx
git commit -m "feat: 週開始を切り替える設定ポップオーバーSettingsMenuを追加する"
```

---

## Task 2: CalendarApp の weekStart 状態 ＋ L1/L2/L3 配線

**Files:**
- Modify: `src/components/CalendarApp.tsx`
- Modify: `src/components/MonthDetail.tsx`
- Modify: `src/components/WeekView.tsx`
- Modify: `src/components/DayView.tsx`

**Interfaces:**
- Consumes: `SettingsMenu`（`@/components/SettingsMenu`）、`WeekStart`（`@/domain/calendar`）。
- Produces:
  - `MonthDetail`/`WeekView`/`DayView` に prop `weekStart: WeekStart` と `onWeekStartChange: (weekStart: WeekStart) => void`。
  - `CalendarApp` の `weekStart` 状態と `changeWeekStart`。

- [ ] **Step 1: CalendarApp に import・定数・状態を追加**

`src/components/CalendarApp.tsx`:
- import に **`WeekStart` のみ**追加（`SettingsMenu` は各ビューが描画するので CalendarApp には入れない＝未使用 import は `noUnusedLocals` で落ちる）:
```tsx
import type { WeekStart } from "@/domain/calendar";
```

- 既存 `LAYOUT_STORAGE_KEY` の下に定数追加:
```tsx
const LAYOUT_STORAGE_KEY = "tonihaya.overviewLayout";
const WEEKSTART_STORAGE_KEY = "tonihaya.weekStart";
```

- `changeOverviewLayout` の下に状態＋永続化を追加（既存 `overviewLayout` と同型）:
```tsx
  // 週開始（日/月）。localStorage に保存し次回以降も維持。全ビューに反映する。
  const [weekStart, setWeekStart] = useState<WeekStart>("sun");
  useEffect(() => {
    const saved = localStorage.getItem(WEEKSTART_STORAGE_KEY);
    if (saved === "sun" || saved === "mon") setWeekStart(saved);
  }, []);
  const changeWeekStart = (next: WeekStart): void => {
    setWeekStart(next);
    localStorage.setItem(WEEKSTART_STORAGE_KEY, next);
  };
```

- [ ] **Step 2: CalendarApp から L1/L2/L3 へ props を配線**

`src/components/CalendarApp.tsx` の各分岐に prop を追加:
- day 分岐 `<DayView …>` に:
```tsx
              weekStart={weekStart}
              onWeekStartChange={changeWeekStart}
```
- week 分岐 `<WeekView …>` に同上2行を追加。
- month(L1) 分岐 `<MonthDetail …>` に同上2行を追加。

- [ ] **Step 3: MonthDetail に prop・SettingsMenu・weekStart 反映を追加**

`src/components/MonthDetail.tsx`:
- 冒頭 import に追加:
```tsx
import type { WeekStart } from "@/domain/calendar";
import { SettingsMenu } from "@/components/SettingsMenu";
```
- props 型と分割代入に追加（`onJump` の隣）:
```tsx
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
```
- build 呼び出しのハードコードを差し替え:
```tsx
  const detail = buildMonthDetail(year, month, today, { weekStart });
```
- `<MonthCard … weekStart="sun" …>` を `weekStart={weekStart}` に変更。
- nav 末尾の LevelSwitcher ラッパを次で置換（歯車を左に）:
```tsx
        <div className="ml-auto flex items-center gap-2">
          <SettingsMenu weekStart={weekStart} onWeekStartChange={onWeekStartChange} />
          <LevelSwitcher current="month" onJump={onJump} />
        </div>
```

- [ ] **Step 4: WeekView に prop・SettingsMenu・weekStart 反映を追加**

`src/components/WeekView.tsx`:
- 冒頭 import に追加:
```tsx
import type { WeekStart } from "@/domain/calendar";
import { SettingsMenu } from "@/components/SettingsMenu";
```
- props 型と分割代入に追加（`onJump` の隣）:
```tsx
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
```
- build 呼び出しのハードコードを差し替え:
```tsx
  const week = buildWeekView(year, month, day, today, { weekStart });
```
- nav 末尾の LevelSwitcher ラッパを次で置換:
```tsx
        <div className="ml-auto flex items-center gap-2">
          <SettingsMenu weekStart={weekStart} onWeekStartChange={onWeekStartChange} />
          <LevelSwitcher current="week" onJump={onJump} />
        </div>
```

- [ ] **Step 5: DayView に prop・SettingsMenu を追加（buildは不変）**

`src/components/DayView.tsx`:
- 冒頭 import に追加:
```tsx
import type { WeekStart } from "@/domain/calendar";
import { SettingsMenu } from "@/components/SettingsMenu";
```
- props 型と分割代入に追加（`onJump` の隣）:
```tsx
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
```
（`buildDayView` は週概念が無いため weekStart は使わない。歯車表示のため受け取るだけ。）
- nav 末尾の LevelSwitcher ラッパを次で置換:
```tsx
        <div className="ml-auto flex items-center gap-2">
          <SettingsMenu weekStart={weekStart} onWeekStartChange={onWeekStartChange} />
          <LevelSwitcher current="day" onJump={onJump} />
        </div>
```

- [ ] **Step 6: 検証3点セット**

Run: `npx tsc --noEmit && npx vitest run && npx next build`
Expected: 型エラーなし、116テスト緑、ビルド成功、First Load < 150KB。

- [ ] **Step 7: コミット**

```bash
git add src/components/CalendarApp.tsx src/components/MonthDetail.tsx src/components/WeekView.tsx src/components/DayView.tsx
git commit -m "feat: 週開始状態をCalendarAppに持たせL1/L2/L3のnavに設定歯車を配線する"
```

---

## Task 3: L0（OverviewBody）配線

**Files:**
- Modify: `src/components/OverviewBody.tsx`
- Modify: `src/components/CalendarApp.tsx`

**Interfaces:**
- Consumes: `SettingsMenu`（`@/components/SettingsMenu`）、`WeekStart`（`@/domain/calendar`）、`weekStart`/`changeWeekStart`（CalendarApp、Task2で定義済み）。
- Produces: `OverviewBody` に prop `weekStart: WeekStart` と `onWeekStartChange: (weekStart: WeekStart) => void`。

- [ ] **Step 1: OverviewBody に import・prop・weekStart 反映を追加**

`src/components/OverviewBody.tsx`:
- 冒頭 import に追加:
```tsx
import type { WeekStart } from "@/domain/calendar";
import { SettingsMenu } from "@/components/SettingsMenu";
```
- props 型と分割代入に追加（`onJump` の隣）:
```tsx
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
```
- build 呼び出しのハードコードを差し替え:
```tsx
  const view = buildYearView(year, today, { weekStart });
```
- `<MonthCard … weekStart="sun" …>` を `weekStart={weekStart}` に変更。

- [ ] **Step 2: 右クラスタのレイアウト切替と LevelSwitcher の間に SettingsMenu を置く**

`src/components/OverviewBody.tsx` の右クラスタ（`<div className="ml-auto flex items-center gap-3">`）内で、レイアウト切替 div と `<LevelSwitcher …>` の**間**に挿入:
```tsx
          <SettingsMenu weekStart={weekStart} onWeekStartChange={onWeekStartChange} />
          <LevelSwitcher current="overview" onJump={onJump} />
```
（結果の順序: レイアウト切替 → 歯車 → LevelSwitcher。）

- [ ] **Step 3: CalendarApp から OverviewBody へ props を配線**

`src/components/CalendarApp.tsx` の overview 分岐 `<OverviewBody …>` に追加:
```tsx
            weekStart={weekStart}
            onWeekStartChange={changeWeekStart}
```

- [ ] **Step 4: 検証3点セット**

Run: `npx tsc --noEmit && npx vitest run && npx next build`
Expected: 型エラーなし、116テスト緑、ビルド成功、First Load < 150KB。

- [ ] **Step 5: コミット**

```bash
git add src/components/OverviewBody.tsx src/components/CalendarApp.tsx
git commit -m "feat: L0俯瞰にも設定歯車を配線し週開始を全ビューへ反映する"
```

---

## Task 4: 実機E2E検証（Playwright MCP）

**Files:** なし（検証のみ）。不具合時のみ修正し追加コミット。

**前提:** `npx next build` 済み。`python3 -m http.server 4599 --directory out` で配信（`cd` しない）。

- [ ] **Step 1: 配信**

```bash
python3 -m http.server 4599 --directory out
```

- [ ] **Step 2: 歯車→ポップオーバー開閉**

各URL（`/?y=2026` / `&m=7` / `&m=7&d=15&v=week` / `&m=7&d=15&v=day`）で nav に歯車があり、クリックでポップオーバー（「週開始 日/月」）が開く。`Escape` と**ポップオーバー外クリック**で閉じることを確認。歯車は LevelSwitcher の左隣（L0はレイアウト切替→歯車→LevelSwitcher の順）。

- [ ] **Step 3: 週開始の反映（日→月）**

L0（`/?y=2026`）で歯車→「月」を選択:
- L0 月カードの曜日ヘッダーが「月 火 水 木 金 土 日」並びになる（`getComputedStyle`/テキストで先頭が「月」）。
- L1（`&m=7`）へ移動し曜日ヘッダーが月始まりになる。
- L2（`&m=7&d=15&v=week`）で週の先頭列が月曜（`buildWeekView` の先頭日 weekday=1）になる。
- L3（`&m=7&d=15&v=day`）は見た目変化なし・歯車は表示。

- [ ] **Step 4: 永続化の確認**

「月」に設定した状態で**ページをリロード**（`/?y=2026` を再ロード）し、曜日ヘッダーが月始まりのまま（localStorage 維持）であること。次に「日」に戻すと既定並びに戻り、リロードでも維持されること。

- [ ] **Step 5: サーバ停止と最終3点セット**

```bash
pkill -f "http.server 4599"
npx vitest run && npx tsc --noEmit && npx next build
```
Expected: 全緑・ビルド成功・First Load < 150KB。

- [ ] **Step 6: progress.md 更新**

`.superpowers/sdd/progress.md` に設定パネルのセクションを追記（各タスクの commit と E2E結果）。

---

## Self-Review

- **Spec coverage:** §3 状態/永続化→Task2 Step1。§4 SettingsMenu→Task1。§5 配置→Task2(L1/L2/L3)・Task3(L0)。§6 配線→Task2/3。§7 反映範囲→Task2/3のbuild差し替え（L3は受取のみ）。§8テスト→ドメイン既存/Task4実機。§9受け入れ基準→全項目タスク対応あり。
- **Placeholder scan:** コードは全て実体。曖昧表現なし。歯車SVGはインライン実体。
- **Type consistency:** `WeekStart`＝`"sun"|"mon"`（`@/domain/calendar`）、`weekStart: WeekStart`、`onWeekStartChange: (weekStart: WeekStart) => void`、`changeWeekStart`、`WEEKSTART_STORAGE_KEY="tonihaya.weekStart"`、`SettingsMenu` props（`weekStart`/`onWeekStartChange`）は Task1〜3 で一貫。build 呼び出しは `{ weekStart }` に統一。
- **注意（Task2 Step1）:** CalendarApp には `SettingsMenu` import を入れない（各ビューが描画・未使用importはtsc落ち）。`WeekStart` import のみ追加。
