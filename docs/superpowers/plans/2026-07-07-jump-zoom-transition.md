# ジャンプ・ズーム遷移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「年/月/週/日」ジャンプ時に、押下で解決される「その日（が属する対象）」へズームイン/アウトする（隣接＝既存ドリルモーフ流用、多段＝日アンカー `jump-zoom`、逆も対称）。

**Architecture:** `CalendarApp.jumpTo` をジャンプ距離で分岐する。隣接（1レベル差）は既存の `pivotDay`(day-zoom)/`dayPivot`(hour-zoom)/`month-N` を張ってモーフさせる。多段（2レベル以上）は新状態 `jumpPivot` を張り、各ビューが「その日」の要素に `viewTransitionName:"jump-zoom"` を付与し、`month-N` を抑制する。View Transitions の中間フレームは Playwright で撮れないため、検証は共有要素名の DOM 検証＋ユーザー実機確認。

**Tech Stack:** Next.js(App Router) / React 19(useState, flushSync) / TypeScript / View Transitions API / Tailwind v4。

## Global Constraints

- コミット: `type: 日本語説明`（命令形・先頭小文字の英語型名・末尾ピリオドなし）、**`Co-Authored-By` なし**、1意味単位=1コミット。SDDでは1本の feature ブランチ `feat/jump-zoom-transition` にタスク毎コミット。
- `npm run dev` はフックでブロック。検証は `npx next build` + `python3 -m http.server 4599 --directory out`（`cd` しない）。
- 検証3点セット: `npx vitest run && npx tsc --noEmit && npx next build`。116テスト緑維持・First Load JS < 150KB。
- 色は必ず既存CSSトークン経由（ハードコード色禁止）。この機能は主に `viewTransitionName` の付与で色追加は無し。
- 共有要素名は **1ビュー内で1要素のみ**（複数付与は衝突）。ジャンプ中は常に共有要素を1つに保つ。
- 既存のドリルダウン・モーフ（`month-N`/`day-zoom`/`hour-zoom`）は不変（回帰禁止）。
- レベル順: `overview=0, month=1, week=2, day=3`。隣接=距離1、多段=距離2以上。
- 「その日」（アンカー）= `resolveJumpTarget("day", zoom, today)` の `{year, month, day}`（文脈保持＋today補完＋日クランプ済み）。

---

## File Structure

- **Modify** `src/components/CalendarApp.tsx` — `jumpTo` を距離分岐に書換え、`jumpPivot` 状態追加、非ジャンプ遷移での `jumpPivot` 掃除、各ビューへ `jumpPivot`（多段用）を配線。
- **Modify** `src/components/MonthCard.tsx` — `jumpDay` prop 追加、per-cell で `jump-zoom` を付与（`inMonth` の実セルのみ）。
- **Modify** `src/components/OverviewBody.tsx` — `jumpPivot` prop 追加、各 MonthCard に `jumpDay` を渡す、`month-N` を `jumpPivot` 時に抑制。
- **Modify** `src/components/MonthDetail.tsx` — `jumpPivot` prop 追加、MonthCard に `jumpDay`、`month-N` を抑制。
- **Modify** `src/components/WeekView.tsx` — `jumpPivot` prop 追加、日ヘッダーに `jump-zoom`（`hour-zoom` と排他）。
- **Modify** `src/components/DayView.tsx` — `jumpPivot` prop 追加、外枠を `jumpPivot ? "jump-zoom" : "hour-zoom"`。

---

## Task 1: 隣接ジャンプのモーフ（CalendarApp の jumpTo 分岐）

**Files:**
- Modify: `src/components/CalendarApp.tsx`

**Interfaces:**
- Consumes: `resolveJumpTarget`, `JumpLevel`（既存）、`pivotDay`/`setPivotDay`/`dayPivot`/`setDayPivot`（既存）。
- Produces: `jumpTo` が隣接ジャンプで既存ピボットを張る（`jumpPivot` は Task2 で追加）。

**背景:** 現状 `jumpTo` は両ピボットを掃除して navigate（クロスフェード）。隣接 L1↔L2 / L2↔L3 は既存ピボットを張ればモーフする。L0↔L1 は `month-N` が無条件なので掃除して navigate すれば自動モーフ。多段はこのタスクではクロスフェードのまま（Task2）。

- [ ] **Step 1: レベル順定数と jumpTo の書換え**

`src/components/CalendarApp.tsx`：`jumpTo` 定義（現行 95-101 行付近）を次で置換。冒頭の `const LEVEL_ORDER` はコンポーネント外（`WEEKSTART_STORAGE_KEY` の下あたり、モジュールスコープ）に追加。

モジュールスコープに追加:
```tsx
const LEVEL_ORDER: Record<JumpLevel, number> = { overview: 0, month: 1, week: 2, day: 3 };
```

`jumpTo` を置換:
```tsx
  // 年/月/週/日セグメントからのジャンプ。距離で分岐し、隣接は既存モーフを流用する。
  // 隣接 L1↔L2=day-zoom(pivotDay) / L2↔L3=hour-zoom(dayPivot) / L0↔L1=month-N(無条件)。
  // 多段は Task2 で jump-zoom を張る（現時点ではクロスフェード）。
  const jumpTo = (level: JumpLevel): void => {
    const target = resolveJumpTarget(level, zoom, today);
    const dist = Math.abs(LEVEL_ORDER[target.level] - LEVEL_ORDER[zoom.level]);
    const a = resolveJumpTarget("day", zoom, today);
    const anchorDay: CivilDate = { year: a.year, month: a.month!, day: a.day! };
    const levels = new Set<JumpLevel>([zoom.level, target.level]);

    flushSync(() => {
      if (dist >= 2) {
        // 多段（現状クロスフェード。Task2でjump-zoom）
        setPivotDay(null);
        setDayPivot(null);
      } else if (levels.has("week") && levels.has("day")) {
        // 隣接 L2↔L3: hour-zoom
        setPivotDay(null);
        setDayPivot(anchorDay);
      } else if (levels.has("month") && levels.has("week")) {
        // 隣接 L1↔L2: day-zoom
        setDayPivot(null);
        setPivotDay(anchorDay);
      } else {
        // 隣接 L0↔L1: month-N（無条件）
        setPivotDay(null);
        setDayPivot(null);
      }
    });
    navigate(target, "push");
  };
```

- [ ] **Step 2: 検証3点セット**

Run: `npx tsc --noEmit && npx vitest run && npx next build`
Expected: 型エラーなし、116テスト緑、ビルド成功、First Load < 150KB。

- [ ] **Step 3: コミット**

```bash
git add src/components/CalendarApp.tsx
git commit -m "feat: 隣接レベルへのジャンプで既存ズームモーフを流用する"
```

---

## Task 2: 多段ジャンプの日アンカー `jump-zoom`

**Files:**
- Modify: `src/components/CalendarApp.tsx`
- Modify: `src/components/MonthCard.tsx`
- Modify: `src/components/OverviewBody.tsx`
- Modify: `src/components/MonthDetail.tsx`
- Modify: `src/components/WeekView.tsx`
- Modify: `src/components/DayView.tsx`

**Interfaces:**
- Consumes: Task1 の `jumpTo`/`LEVEL_ORDER`/`anchorDay`。
- Produces:
  - `CalendarApp` に `jumpPivot: CivilDate | null` 状態。多段ジャンプ時に設定、非ジャンプ遷移で掃除。
  - 各ビューに prop `jumpPivot: { readonly year:number; readonly month:number; readonly day:number } | null`。
  - `MonthCard` に prop `jumpDay: { readonly year:number; readonly month:number; readonly day:number } | null`。

- [ ] **Step 1: CalendarApp に jumpPivot 状態を追加し jumpTo の多段分岐で設定**

`src/components/CalendarApp.tsx`：`dayPivot` state 定義の下に追加:
```tsx
  // 多段ジャンプ（2レベル以上）のズーム起点。全ビューが「その日」の要素に jump-zoom を張る。
  const [jumpPivot, setJumpPivot] = useState<CivilDate | null>(null);
```

`jumpTo` の `dist >= 2` 分岐を次に変更（`setJumpPivot(anchorDay)` を追加）:
```tsx
      if (dist >= 2) {
        // 多段: 日アンカー jump-zoom。他ピボットは掃除。
        setPivotDay(null);
        setDayPivot(null);
        setJumpPivot(anchorDay);
      } else if (levels.has("week") && levels.has("day")) {
```
また、隣接3分岐すべてで `setJumpPivot(null)` を追加する（各 `flushSync` 内に1行）。具体的には L2↔L3・L1↔L2・L0↔L1 の各 else-if/else ブロック内に `setJumpPivot(null);` を足す。

- [ ] **Step 2: 非ジャンプ遷移で jumpPivot を掃除**

`jump-zoom` が次の遷移に取り残されないよう、ジャンプ以外の遷移ハンドラで `jumpPivot` を掃除する。`src/components/CalendarApp.tsx` の以下を変更:

- `clearPivotThen`（現行）を次に変更:
```tsx
  const clearPivotThen = (run: () => void): void => {
    flushSync(() => {
      setPivotDay(null);
      setJumpPivot(null);
    });
    run();
  };
```
- `openDayWeek` の `flushSync` 内に `setJumpPivot(null);` を追加（`setPivotDay(day)` の隣）。
- `openDay` の `flushSync` 内に `setJumpPivot(null);` を追加。
- day 分岐 `onBack`（現行 `navigate(week…)` のみ）を次に変更:
```tsx
              onBack={() => {
                flushSync(() => setJumpPivot(null));
                navigate(
                  { level: "week", year: zoom.year, month: zoom.month!, day: zoom.day! },
                  "push",
                );
              }}
```
- day 分岐 `onDayChange` の `setDayPivot(...)` の直前に `setJumpPivot(null);` を追加。
- week 分岐 `onBack`/`onWeekChange` の各 `flushSync(() => setDayPivot(null))` を `flushSync(() => { setDayPivot(null); setJumpPivot(null); })` に変更。
- overview 分岐 `onYearChange`（`navigate({overview…}, "replace")`）と `onMonthClick`（`navigate({month…}, "push")`）を、遷移前に `flushSync(() => setJumpPivot(null))` してから navigate するよう変更:
```tsx
            onYearChange={(y) => {
              flushSync(() => setJumpPivot(null));
              navigate({ level: "overview", year: clampYear(y) }, "replace");
            }}
            onMonthClick={(m) => {
              flushSync(() => setJumpPivot(null));
              navigate({ level: "month", year: zoom.year, month: m }, "push");
            }}
```
- `zoom.level` 監視 useEffect（現行 `if (zoom.level !== "week" && zoom.level !== "day") setDayPivot(null);`）はそのまま（dayPivot専用）。jumpPivot は上記ハンドラ掃除で十分。

- [ ] **Step 3: CalendarApp から各ビューへ jumpPivot を配線**

各ビューJSXに `jumpPivot={jumpPivot}` を追加:
- day 分岐 `<DayView …>` に `jumpPivot={jumpPivot}`
- week 分岐 `<WeekView …>` に `jumpPivot={jumpPivot}`
- month(L1) 分岐 `<MonthDetail …>` に `jumpPivot={jumpPivot}`
- overview 分岐 `<OverviewBody …>` に `jumpPivot={jumpPivot}`

- [ ] **Step 4: MonthCard に jumpDay を追加し日セルに jump-zoom を付与**

`src/components/MonthCard.tsx`：
- props 型に追加（`pivotDay` の隣）:
```tsx
  readonly jumpDay?: { readonly year: number; readonly month: number; readonly day: number } | null;
```
- 分割代入に `jumpDay` を追加。
- セル map 内、`isPivot` の下に `isJump` を追加（**実セル `cell.inMonth` のみ**でパディング重複を防ぐ）:
```tsx
          const isJump =
            !!jumpDay &&
            cell.inMonth &&
            !!resolved &&
            resolved.year === jumpDay.year &&
            resolved.month === jumpDay.month &&
            cell.day === jumpDay.day;
```
- `<DayCellView … pivot={isPivot} />` に `jump={isJump}` を追加。
- `DayCellView` の props 型に `readonly jump: boolean;` を追加（`pivot` の隣）。分割代入にも追加。
- `DayCellView` の `zoomStyle` を次に変更（day-zoom 優先、無ければ jump-zoom）:
```tsx
  const zoomStyle = pivot
    ? { viewTransitionName: "day-zoom" }
    : jump
      ? { viewTransitionName: "jump-zoom" }
      : null;
```

- [ ] **Step 5: OverviewBody で jumpPivot を受け MonthCard に jumpDay を渡す＋month-N抑制**

`src/components/OverviewBody.tsx`：
- props 型と分割代入に `jumpPivot`（`onWeekStartChange` の隣）追加:
```tsx
  readonly jumpPivot: { readonly year: number; readonly month: number; readonly day: number } | null;
```
- **重要**: 現状 L0 の MonthCard は `year` を渡していない（`month`/`weekStart`/`viewTransitionName`/`onClick` のみ）。MonthCard 内の `resolved`（セルの実年月）は `year` が無いと undefined になり `jumpDay` 判定が常に false になる。したがって **`year={year}` を必ず追加する**（OverviewBody は `year` prop を持つ）。各 MonthCard 呼び出しを次に変更（`year` 追加＋month-N 抑制＋jumpDay 伝播）:
```tsx
            <div key={m.month} className={`w-[305px] ${zoomClass}`}>
              <MonthCard
                month={m}
                year={year}
                weekStart={weekStart}
                viewTransitionName={jumpPivot ? undefined : `month-${m.month}`}
                jumpDay={jumpPivot}
                onClick={() => onMonthClick(m.month)}
              />
            </div>
```

- [ ] **Step 6: MonthDetail で jumpPivot を受け MonthCard に jumpDay＋month-N抑制**

`src/components/MonthDetail.tsx`：
- props 型と分割代入に `jumpPivot`（`onWeekStartChange` の隣）追加（型は Step5 と同一）。
- カレンダーラッパの `style={{ viewTransitionName: `month-${month}` }}` を次に変更:
```tsx
          style={{ viewTransitionName: jumpPivot ? undefined : `month-${month}` }}
```
- `<MonthCard … pivotDay={pivotDay} />` に `jumpDay={jumpPivot}` を追加。

- [ ] **Step 7: WeekView の日ヘッダーに jump-zoom（hour-zoomと排他）**

`src/components/WeekView.tsx`：
- props 型と分割代入に `jumpPivot`（`onWeekStartChange` の隣）追加（型は Step5 と同一）。
- 既存 `isPivot` ヘルパの下に `isJump` を追加:
```tsx
  const isJump = (d: WeekDay): boolean =>
    jumpPivot !== null &&
    jumpPivot.year === d.year &&
    jumpPivot.month === d.month &&
    jumpPivot.day === d.day;
```
- 日ヘッダー button の `style`（現行 `isPivot(d) ? { viewTransitionName: "hour-zoom" } : undefined`）を次に変更:
```tsx
              style={
                isPivot(d)
                  ? { viewTransitionName: "hour-zoom" }
                  : isJump(d)
                    ? { viewTransitionName: "jump-zoom" }
                    : undefined
              }
```

- [ ] **Step 8: DayView 外枠を jumpPivot で jump-zoom に**

`src/components/DayView.tsx`：
- props 型と分割代入に `jumpPivot`（`onWeekStartChange` の隣）追加（型は Step5 と同一）。
- 時間グリッド外枠（現行 `viewTransitionName: "hour-zoom"` の要素）を次に変更:
```tsx
        style={{ borderColor: "var(--border)", viewTransitionName: jumpPivot ? "jump-zoom" : "hour-zoom" }}
```

- [ ] **Step 9: 検証3点セット**

Run: `npx tsc --noEmit && npx vitest run && npx next build`
Expected: 型エラーなし、116テスト緑、ビルド成功、First Load < 150KB。

- [ ] **Step 10: コミット**

```bash
git add src/components/CalendarApp.tsx src/components/MonthCard.tsx src/components/OverviewBody.tsx src/components/MonthDetail.tsx src/components/WeekView.tsx src/components/DayView.tsx
git commit -m "feat: 多段ジャンプで日アンカーのjump-zoomズームを実装する"
```

---

## Task 3: 実機E2E検証（Playwright MCP）

**Files:** なし（検証のみ）。不具合時のみ修正し追加コミット。

**前提:** `npx next build` 済み。`python3 -m http.server 4599 --directory out` で配信（`cd` しない）。View Transitions のモーフ中間フレームは捕捉不可のため、**遷移直前/直後の DOM で共有要素名を検証**する（`getComputedStyle(el).viewTransitionName`）。

- [ ] **Step 1: 配信**

```bash
python3 -m http.server 4599 --directory out
```

- [ ] **Step 2: 隣接ジャンプの共有要素検証**

- L2（`/?y=2026&m=7&d=15&v=week`）で「日」ボタン押下 → 遷移前に L2 の d=15 日ヘッダーが `hour-zoom`（`dayPivot` セット）になり、遷移後 L3 外枠が `hour-zoom`。
- L1（`/?y=2026&m=7`）で「週」ボタン → L1 の d=（today補完）セルが `day-zoom`、遷移後 L2 外枠が `day-zoom`。
- L0（`/?y=2026`）で「月」ボタン → L0/L1 とも `month-${month}` が付く（`jumpPivot` 非null時は抑制されない＝隣接なので jumpPivot は null）。
- いずれも「1ビュー1共有要素」を確認。

- [ ] **Step 3: 多段ジャンプの jump-zoom 検証**

- L0（`/?y=2026`）で「日」ボタン → 遷移前 L0 の「その日」セル（`cell.inMonth`）に `jump-zoom` が1つだけ付き、`month-N` が抑制（俯瞰カードの `viewTransitionName` が none/undefined）。遷移後 L3 外枠が `jump-zoom`。
- L3（`/?y=2026&m=3&d=15&v=day`）で「年」ボタン → L3 外枠が `jump-zoom`、遷移後 L0 の 3月カードの d=15 セルに `jump-zoom` が1つだけ・`month-N` 抑制。
- L1（`/?y=2026&m=7`）で「日」ボタン → L1 の d=（today補完）セルが `jump-zoom`、遷移後 L3 外枠 `jump-zoom`。
- 各ケースで `jump-zoom` が**ちょうど1要素**、`day-zoom`/`hour-zoom` が非出現を確認。

- [ ] **Step 4: 回帰（ドリルダウン）と掃除の検証**

- ドリルダウン（月カードクリック/日クリック/日ヘッダークリック）の既存モーフ（`month-N`/`day-zoom`/`hour-zoom`）が従来通り付くこと。
- 多段ジャンプ後にドリルダウンや戻るをした際、`jump-zoom` が取り残されない（掃除される）こと＝次の遷移で `jump-zoom` を持つ要素が source/target に1つも無いか、意図した要素のみ。

- [ ] **Step 5: ユーザー実機確認（見た目のズーム感）**

サーバURL（`http://localhost:4599`）をユーザーに提示し、各ジャンプのズームイン/アウトの体感を確認してもらう。気になる点があれば微調整（アニメーション時間・アンカー要素など）。

- [ ] **Step 6: サーバ停止と最終3点セット**

```bash
pkill -f "http.server 4599"
npx vitest run && npx tsc --noEmit && npx next build
```
Expected: 全緑・ビルド成功・First Load < 150KB。

- [ ] **Step 7: progress.md 更新**

`.superpowers/sdd/progress.md` にジャンプ・ズームのセクションを追記（各タスクの commit と E2E結果）。

---

## Self-Review

- **Spec coverage:** §3隣接挙動→Task1。§3多段挙動→Task2。§4.1隣接=既存pivot→Task1。§4.2多段=jump-zoom→Task2 Step4-8。§4.3 month-N抑制/1要素→Task2 Step5-8。§4.4 ライフサイクル掃除→Task2 Step2。§5 reduced-motion→既存withTransition（変更なし）。§6テスト→Task3。§7受け入れ基準→全項目タスク対応あり。
- **Placeholder scan:** コードは実体。曖昧表現なし。OverviewBody Step5 の「year を既に渡している前提」は実装時に既存を確認して合わせる旨を明記済み（既存の MonthCard 呼び出しに合わせる）。
- **Type consistency:** `jumpPivot`/`jumpDay` の型は `{year,month,day}|null` で全ファイル一致。`CivilDate` は CalendarApp 内既存。`anchorDay: CivilDate`、`LEVEL_ORDER: Record<JumpLevel, number>`、`jump-zoom` 名称一貫。`setJumpPivot`/`isJump`/`isJump(d)` 命名一貫。
