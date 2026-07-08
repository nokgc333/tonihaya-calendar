# ズームアンカーの対象化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** day-zoom / hour-zoom のモーフアンカーを「大きなビュー外枠」から「その日の見出し要素」へ付け替え、方向を対象に定め拡大を控えめにする。

**Architecture:** `WeekView` の日ヘッダーに `day-zoom` を（`pivotDay` 一致時）付与し外枠から除去、`DayView` の日付ヘッダーバーに `hour-zoom` を付与し外枠から除去、`CalendarApp` から `WeekView` へ `pivotDay` を配線する。3ファイルは相互依存するため1タスクで同時に変更する（部分適用は L1↔L2 モーフを壊す）。ドメイン/単体テスト変更なし。検証は静的ビルド＋Playwright での DOM 共有要素検証（View Transition 中間フレームは捕捉不可）。

**Tech Stack:** Next.js(App Router) / React 19 / TypeScript / View Transitions API / Tailwind v4 / Playwright(MCP)。

## Global Constraints

- コミット: `type: 日本語説明`（命令形・先頭小文字の英語型名・末尾ピリオドなし）、**`Co-Authored-By` なし**、1意味単位=1コミット。ブランチは既存の `feat/jump-zoom-transition`（本作業の継続）。
- `npm run dev` はフックでブロック。検証は `npx next build` + `python3 -m http.server 4599 --directory out`（`cd` しない）。
- 検証3点セット: `npx vitest run && npx tsc --noEmit && npx next build`。116テスト緑維持・First Load JS < 150KB。
- 色は既存CSSトークン経由（今回は `viewTransitionName` 付与のみで色追加なし）。
- 共有要素名は 1スナップショット内で1要素のみ。各遷移で `pivotDay`/`dayPivot`/`jumpPivot` のいずれか1つだけが立つ（既存の相互排他を維持）。
- 多段ジャンプ `jump-zoom`・L0↔L1 `month-N` は不変（回帰禁止）。

---

## Task 1: アンカーを「その日の見出し」へ付け替える

**Files:**
- Modify: `src/components/WeekView.tsx`
- Modify: `src/components/DayView.tsx`
- Modify: `src/components/CalendarApp.tsx`

**Interfaces:**
- Consumes（既存）: `CalendarApp` の `pivotDay: CivilDate | null`（`day-zoom` 起点）、`dayPivot`（`hour-zoom`）、`jumpPivot`（`jump-zoom`）。`WeekDay`（`year`/`month`/`day`/... を持つ、`buildWeekView` 由来）。
- Produces: `WeekView` が新 prop `pivotDay: { readonly year:number; readonly month:number; readonly day:number } | null` を受け取り、日ヘッダーに `day-zoom` を付与する。外枠は `day-zoom`/`hour-zoom` を持たなくなる。

- [ ] **Step 1: WeekView に pivotDay prop を追加**

`src/components/WeekView.tsx` の props 分割代入（現行 `dayPivot,` の行の隣）に `pivotDay,` を追加し、型定義（現行 `readonly dayPivot: { ... } | null;` の隣）に追加:

```tsx
  readonly pivotDay: { readonly year: number; readonly month: number; readonly day: number } | null;
```

- [ ] **Step 2: WeekView に isDayPivot ヘルパを追加**

`src/components/WeekView.tsx` の既存 `isPivot`/`isJump` ヘルパ定義の直後に追加:

```tsx
  const isDayPivot = (d: WeekDay): boolean =>
    pivotDay !== null &&
    pivotDay.year === d.year &&
    pivotDay.month === d.month &&
    pivotDay.day === d.day;
```

- [ ] **Step 3: WeekView 外枠から day-zoom を除去**

`src/components/WeekView.tsx` の時間グリッド外枠 `<div className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-md border" style={{ borderColor: "var(--border)", viewTransitionName: dayPivot ? "none" : "day-zoom" }}>` の `style` から `viewTransitionName` を削除する:

```tsx
      <div
        className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-md border"
        style={{ borderColor: "var(--border)" }}
      >
```

直前のコメント（`{/* L2⇄L3遷移中(dayPivot非null)は外枠のday-zoomを外し… */}` のブロック）を次に置換:

```tsx
      {/* 外枠は共有要素を持たず root クロスフェードで現れる。ズームは日ヘッダー
          （day-zoom/hour-zoom/jump-zoom）が「その日」を狙って担う。 */}
```

- [ ] **Step 4: WeekView 日ヘッダーに day-zoom を優先順位付きで付与**

`src/components/WeekView.tsx` の日ヘッダー button の `style`（現行 `isPivot(d) ? { viewTransitionName: "hour-zoom" } : isJump(d) ? { viewTransitionName: "jump-zoom" } : undefined`）を次に変更（`hour-zoom` → `day-zoom` → `jump-zoom` の順。相互排他だが順序を明示）:

```tsx
              style={
                isPivot(d)
                  ? { viewTransitionName: "hour-zoom" }
                  : isDayPivot(d)
                    ? { viewTransitionName: "day-zoom" }
                    : isJump(d)
                      ? { viewTransitionName: "jump-zoom" }
                      : undefined
              }
```

- [ ] **Step 5: DayView 外枠から hour-zoom を除去**

`src/components/DayView.tsx` の時間グリッド外枠 `<div className="mx-auto flex w-full min-h-0 max-w-2xl flex-1 flex-col rounded-md border" style={{ borderColor: "var(--border)", viewTransitionName: jumpPivot ? "jump-zoom" : "hour-zoom" }}>` を次に変更（多段時のみ `jump-zoom`、通常は無名）:

```tsx
      <div
        className="mx-auto flex w-full min-h-0 max-w-2xl flex-1 flex-col rounded-md border"
        style={{ borderColor: "var(--border)", viewTransitionName: jumpPivot ? "jump-zoom" : undefined }}
      >
```

直前のコメント（`{/* 時間グリッドの外枠（L2の日カラムからのモーフ着地点）… */}`）を次に置換:

```tsx
      {/* 時間グリッドの外枠。中央寄せ・狭幅はここだけ。hour-zoom は日付ヘッダーバーが担い、
          外枠は多段ジャンプ時のみ jump-zoom を持つ（通常は root クロスフェード）。 */}
```

- [ ] **Step 6: DayView 日付ヘッダーバーに hour-zoom を付与**

`src/components/DayView.tsx` の sticky 日付ヘッダーバー（現行 `<div className="sticky top-0 z-10 grid min-h-[54.5px] shrink-0 items-center pb-1.5" style={{ gridTemplateColumns: GRID_COLS, background: "var(--surface)" }}>`）の `style` に `viewTransitionName` を追加（多段時は外枠が `jump-zoom` を持つのでヘッダーは無名にし二重付与を避ける）:

```tsx
        <div
          className="sticky top-0 z-10 grid min-h-[54.5px] shrink-0 items-center pb-1.5"
          style={{
            gridTemplateColumns: GRID_COLS,
            background: "var(--surface)",
            viewTransitionName: jumpPivot ? undefined : "hour-zoom",
          }}
        >
```

- [ ] **Step 7: CalendarApp から WeekView へ pivotDay を配線**

`src/components/CalendarApp.tsx` の week 分岐 `<WeekView …>` に `pivotDay={pivotDay}` を1行追加（`dayPivot={dayPivot}` の隣）:

```tsx
              dayPivot={dayPivot}
              pivotDay={pivotDay}
```

- [ ] **Step 8: 3点セット検証**

Run: `npx tsc --noEmit && npx vitest run && npx next build`
Expected: 型エラーなし、116テスト緑、ビルド成功、First Load JS < 150KB。

- [ ] **Step 9: Playwright DOM 検証（配信）**

配信（`cd` しない）:

```bash
python3 -m http.server 4599 --directory out
```

Playwright(MCP) で `document.startViewTransition` をラップし、遷移の before/after スナップショットの `viewTransitionName` 分布と `ready`/`finished` を記録する計測を注入（下記を各ページで evaluate）:

```js
() => {
  const w = window; w.__vtLog = [];
  const orig = document.startViewTransition?.bind(document);
  if (!orig) return { hasVT: false };
  document.startViewTransition = (cb) => {
    const collect = () => { const m = {}; document.querySelectorAll('*').forEach(el => { const n = getComputedStyle(el).viewTransitionName; if (n && n !== 'none') m[n] = (m[n]||0)+1; }); return m; };
    const before = collect();
    const t = orig(() => cb());
    const e = { before, after: null, ready: 'pending' }; w.__vtLog.push(e);
    t.ready.then(() => { e.ready = 'ok'; e.after = collect(); }, (err) => { e.ready = 'REJECTED:' + (err && err.message); e.after = collect(); });
    return t;
  };
  return { hasVT: true };
}
```

検証ケース（各ケース: navigate → 計測注入 → ジャンプ/ドリル click → `window.__vtLog` 確認）:
1. **L1→L2 ジャンプ**: `/?y=2026&m=7` で「週」button → `before` に `day-zoom` 1・`after` に `day-zoom` 1・`ready: ok`。`before`/`after` とも `day-zoom` は外枠でなく日ヘッダー/日セル（外枠に day-zoom が無い＝分布に余計な day-zoom が増えない）。
2. **L2→L3 ジャンプ**: `/?y=2026&m=7&d=8&v=week` で「日」button → `before`/`after` に `hour-zoom` 1・`ready: ok`。
3. **L1→L2 ドリル（回帰）**: `/?y=2026&m=7` の日セル click → `day-zoom` ペア・`ready: ok`。
4. **L2→L3 ドリル（回帰）**: 週ビューの日ヘッダー click → `hour-zoom` ペア・`ready: ok`。
5. **多段 L0→日（回帰）**: `/?y=2026` で「日」button → `jump-zoom` ペア・`ready: ok`（不変）。

Expected: 全ケースで対象モーフが1ペア・skip なし。外枠に `day-zoom`/`hour-zoom` が付かない。

- [ ] **Step 10: 配信停止**

```bash
pkill -f "http.server 4599"
```

- [ ] **Step 11: コミット**

```bash
git add src/components/WeekView.tsx src/components/DayView.tsx src/components/CalendarApp.tsx
git commit -m "feat: ズームアンカーを対象の日の見出しに定める"
```

---

## Task 2: ユーザー実機確認と仕上げ

**Files:** なし（確認のみ。微調整が要る場合のみ追加コミット）。

- [ ] **Step 1: 実機確認の配信**

```bash
npx next build && python3 -m http.server 4599 --directory out
```

ユーザーに URL 提示: L1→週=`http://localhost:4599/?y=2026&m=7`、L2→日=`http://localhost:4599/?y=2026&m=7&d=8&v=week`、L0→月/日、ドリルダウン（日クリック）。「方向が該当日に定まり・拡大が控えめになったか」を確認してもらう。

- [ ] **Step 2: 微調整（必要時のみ）**

違和感が残る場合のみ、アンカー要素の選択（例: DayView をヘッダーバー→日付テキスト）やアニメ時間を調整し、Task1 Step8-9 の検証を再実行して追加コミット。不要なら本ステップはスキップ。

- [ ] **Step 3: 配信停止と最終3点セット**

```bash
pkill -f "http.server 4599"
npx vitest run && npx tsc --noEmit && npx next build
```

Expected: 全緑・ビルド成功・First Load < 150KB。

- [ ] **Step 4: progress.md 更新**

`.superpowers/sdd/progress.md` の「ジャンプ・ズーム遷移」節に、ズームアンカー対象化の commit と E2E結果を追記。

---

## Self-Review

- **Spec coverage:** §4 アンカー変更→Task1 Step3-6。§5.1 WeekView→Step1-4。§5.2 DayView→Step5-6。§5.3 CalendarApp→Step7。§6 相互排他→Step4 の優先順位＋Global Constraints。§7 テスト→Step8-9。§8 エッジ→検証で問題なければ許容（コード追加不要）。§9 受け入れ基準→Task1（モーフ）＋Task2 Step1（ユーザー確認）。
- **Placeholder scan:** 各コード step に実体コードあり。曖昧表現なし。Task2 Step2 は条件付き（必要時のみ）と明示。
- **Type consistency:** `pivotDay` の型 `{year,month,day}|null` は WeekView 追加 prop・CalendarApp の `pivotDay` state（`CivilDate|null`）と一致。`isDayPivot(d: WeekDay): boolean` は既存 `isPivot`/`isJump` と同型。`viewTransitionName` 値 `day-zoom`/`hour-zoom`/`jump-zoom` は既存 CSS・他コンポーネントと一貫。
