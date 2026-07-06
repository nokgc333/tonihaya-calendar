# 設計: レベルジャンプ（年/月/週/日 切替）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-06 |
| ステータス | 承認済み（実装前） |
| 対象 | tonihaya-calendar / ズーム階層の任意レベル間ジャンプ |
| 関連 | [L2週間ビュー設計](./2026-07-05-l2-week-view-design.md) / [L3日間ビュー設計](./2026-07-05-l3-day-view-design.md) |

## 1. 目的とスコープ

ズーム階層 L0年間 / L1月間 / L2週間 / L3日間 を、隣接レベルへ段階的に移動しなくても、**任意レベルから任意レベルへ1クリックで飛べる**ようにする。各レベルの `<nav>` に「年 / 月 / 週 / 日」のジャンプボタン（レベル切替セグメント）を常設する。

**対象**: L0/L1/L2/L3 の全レベル。
**対象外（YAGNI）**: 直前文脈の永続記憶、キーボードショートカット、アニメーション専用モーフ（非隣接ジャンプはクロスフェードで足りる）。

**方針（A案）**: ジャンプ先解決を純関数に、UIを共有部品に切り出し、CalendarApp にジャンプハンドラを置く。各navへは最小差分で `LevelSwitcher` を配置する。

## 2. ジャンプ先解決（純関数）

`src/domain/view/jumpTarget.ts`:

```
resolveJumpTarget(
  target: "overview" | "month" | "week" | "day",
  zoom: ZoomState,
  today: { year; month; day } | null,
): ZoomState
```

解決規則（**今ある文脈は保持し、足りない細かい情報は today で補完**）:

- **year**: 常に `zoom.year`（表示中の年）を保持する。
- **month**: `zoom.month` があれば保持、無ければ `today.month`（today が null の場合は実行時 `new Date()` の月ではなく、呼び出し側が渡す today を使う。today=null は overview 直後などに限られるため month=1 にフォールバック）。
- **day**: `zoom.day` があれば保持、無ければ `today.day`。ただし対象 `year/month` の**日数でクランプ**する（例: today.day=31 で month=2 → 28/29 に丸め）。today=null の場合は day=1。

target 別に必要フィールドだけを埋める:

| target | 返す ZoomState |
|--------|----------------|
| `overview` | `{ level:"overview", year }` |
| `month` | `{ level:"month", year, month }` |
| `week` | `{ level:"week", year, month, day }` |
| `day` | `{ level:"day", year, month, day }` |

- 純粋関数・テスト。year は既存の値をそのまま使う（クランプは navigate 側の既存 clampYear に委ねる。ここでは year をいじらない）。
- 月の日数算出は既存の日付ユーティリティ（`src/domain/shared/date.ts` の `fromEpochDay`/`toEpochDay` 等）を用い、独自実装を避ける。うるう年（2/29）を含めてテストする。

## 3. UI コンポーネント `LevelSwitcher`

`src/components/LevelSwitcher.tsx`:

- 4分割セグメント「年 / 月 / 週 / 日」を横並びで表示。
- props:
  ```
  {
    current: "overview" | "month" | "week" | "day";
    onJump: (level: "overview" | "month" | "week" | "day") => void;
  }
  ```
- 現在レベルのボタンは **active 表示＋ `disabled`**（自分自身への遷移は無意味なため）。active スタイルは既存 `LayoutButton`（`OverviewBody`）の active 表現（`--today-bg` / `--today-fg` 等のトークン）を踏襲する。
- 非 active ボタンは既存 nav ボタンと同系（`border` + `--border` + `hover:opacity-70`）。サイズは小さめ（`text-xs` 程度）で、L2/L3 の前日/前週 `‹ ›` と並んでも密になりすぎないようにする。
- 色は必ず既存 CSS トークン経由（ハードコード禁止）。

## 4. 配置

- 各 nav に `LevelSwitcher` を `ml-auto` で右寄せ配置する。
- **L0（OverviewBody）**: 既存のレイアウト切替（`表示 3×4 / 4×3`、`ml-auto hidden … min-[1288px]:flex`）の**左隣**に置く。両者を右クラスタに並べるため、`LevelSwitcher` を `ml-auto` にし、レイアウト切替 div からは `ml-auto` を外して隣接させる。
- **L1/L2/L3**: 各 nav の右端に `ml-auto` で配置する。
- レスポンシブ: `LevelSwitcher` はコア操作のため**常時表示**（レイアウト切替の `min-[1288px]` 制約は適用しない）。狭幅では nav が折り返すことを許容する。

## 5. ジャンプ挙動（CalendarApp）

- `jumpTo(level)` を追加:
  ```
  const jumpTo = (level) => {
    flushSync(() => { setPivotDay(null); setDayPivot(null); });
    navigate(resolveJumpTarget(level, zoom, today), "push");
  };
  ```
- **pivot 掃除の理由**: `pivotDay`（L1⇄L2 の `day-zoom`）/ `dayPivot`（L2⇄L3 の `hour-zoom`）は隣接レベル間モーフ専用。非隣接ジャンプで残ると対応先のない共有要素が取り残される。ジャンプ前に両方クリアする。
- 遷移は既存 `withTransition`（`document.startViewTransition(() => flushSync(commit))`）のクロスフェード。非隣接ジャンプでは専用モーフは発生しない（共有要素名が両 DOM に揃わないため）。reduced-motion/非対応は即時フォールバック（既存挙動）。
- `navigate` は既存の year クランプ（`clampYear`）を通す。

## 6. コンポーネント配線

```
CalendarApp（jumpTo を定義し各ビューへ渡す）
 ├ overview → OverviewBody（LevelSwitcher をレイアウト切替の左に）
 ├ month    → MonthDetail（nav 右に LevelSwitcher）
 ├ week     → WeekView（nav 右に LevelSwitcher）
 └ day      → DayView（nav 右に LevelSwitcher）
```

各ビューは新規 prop `onJump: (level) => void`（＝ CalendarApp の `jumpTo`）と、`current`（＝自分のレベル）を `LevelSwitcher` に渡す。

## 7. テスト

| 種別 | 対象 |
|------|------|
| 単体（Vitest） | `resolveJumpTarget`：各現在レベル×各ターゲットの代表ケース、today 補完、日クランプ（2/31→2/28、うるう年 2/29）、today=null フォールバック |
| 実機（Playwright） | 各レベルから年/月/週/日ボタンで正しい URL/ビューへ遷移、現在レベルの active＋disabled、ジャンプ後に隣接ズーム（L1⇄L2⇄L3 モーフ）が壊れないこと、pivot 掃除の確認 |

## 8. 受け入れ基準

- [ ] L0/L1/L2/L3 すべての nav に「年/月/週/日」ボタンが出る
- [ ] 任意レベル→任意レベルへ1クリックで遷移し、URL が正しい（overview=`?y=`、month=`&m=`、week/day=`&d=&v=`）
- [ ] today 補完・文脈保持（例: L1 の3月表示中に「日」→ 3月＋今日の日、対象月の日数でクランプ）
- [ ] 現在レベルのボタンが active 表示かつ disabled
- [ ] L0 ではレイアウト切替の左隣に配置される
- [ ] ジャンプ後も隣接ズーム（L1⇄L2⇄L3 のモーフ）が壊れない（pivot が残らない）
- [ ] 全単体テスト緑・型チェック緑・静的ビルド成功・First Load JS < 150KB
