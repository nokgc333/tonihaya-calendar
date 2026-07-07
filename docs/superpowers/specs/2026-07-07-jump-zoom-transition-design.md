# 設計: ジャンプ・ズーム遷移（年/月/週/日ボタン）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-07 |
| ステータス | 承認済み（実装前） |
| 対象 | tonihaya-calendar / レベルジャンプ時のズーム遷移 |
| 関連 | [レベルジャンプ設計](./2026-07-06-level-jump-switcher-design.md) / L2週間・L3日間設計（ズームモーフ） |

## 1. 目的とスコープ

「年/月/週/日」ボタン（`LevelSwitcher`）でのジャンプ時に、**押下で解決される「その日（が属する対象）」に向かってズームイン/アウト**する。現状ジャンプはクロスフェード（`jumpTo` が pivot を掃除するため）。これを、隣接ドリルダウンと同じ体験に近づける。

**方針**：ジャンプは「1操作で、隣接ドリルダウンと同じズームを起こす」。
- **隣接ジャンプ（1レベル差）** → 既存のドリルダウン・モーフを流用。
- **多段ジャンプ（2レベル以上）** → 日アンカーの共有要素 `jump-zoom` で source→target をモーフ。
- **逆方向（ズームアウト）も対称**に実装。

**対象外（YAGNI）**：カレンダー直接クリックのドリルダウン（既存モーフは不変）、ジャンプ以外の遷移（前後移動・戻る）のモーフ変更。

## 2. 既存のズーム機構（前提）

隣接レベル間のドリルダウンは共有 `view-transition-name` でモーフ済み：

| 隣接 | 共有名 | source側の要素 | target側の要素 |
|------|--------|----------------|----------------|
| L0↔L1 | `month-N`（`month-${month}`） | 俯瞰の月カード（`OverviewBody`） | 月詳細のカード（`MonthDetail`） |
| L1↔L2 | `day-zoom` | 月カードのピボット日セル（`MonthCard`, `pivotDay`） | 週ビュー外枠（`WeekView`） |
| L2↔L3 | `hour-zoom` | 週ビューのピボット日列（`WeekView`, `dayPivot`） | 日ビュー外枠（`DayView`） |

`useZoomState` の `withTransition` が `startViewTransition(() => flushSync(commit))` で遷移をラップ（reduced-motion・非対応は即時フォールバック）。`CalendarApp` の `jumpTo` は現状 `pivotDay`/`dayPivot` を掃除して navigate（＝クロスフェード）。

## 3. ジャンプ時の挙動（受け入れ挙動）

`resolveJumpTarget` が返す「その日」（文脈保持＋today補完）を対象に、以下のズームを起こす。

| ジャンプ | 距離 | モーフ | 効果 |
|---------|------|--------|------|
| L0→月(L1) / L1→年(L0) | 隣接 | `month-N` | 月カードへズームイン / 年グリッド内の月カードへズームアウト |
| L1→週(L2) / L2→月(L1) | 隣接 | `day-zoom` | その日セル→週へ / 週→その日セルへ |
| L2→日(L3) / L3→週(L2) | 隣接 | `hour-zoom` | その日列→日ビューへ / 日ビュー→その日列へ |
| L0↔L2, L0↔L3, L1↔L3 | 多段 | `jump-zoom`（日アンカー） | 「その日」の表現へ向かってズームイン/アウト |

多段時の `jump-zoom` を張る要素：

| レベル | `jump-zoom` を張る要素 |
|--------|------------------------|
| L0 俯瞰 | ジャンプ先月のカード内「その日」セル（`MonthCard`） |
| L1 月間 | 月カード内「その日」セル（`MonthCard`） |
| L2 週間 | 「その日」の日列（`WeekView` 日ヘッダー） |
| L3 日間 | 日ビュー外枠（`DayView`） |

## 4. 実装方針

### 4.1 隣接ジャンプ＝既存 pivot を張る
`jumpTo` を「掃除して navigate」から、**ジャンプ距離に応じて適切な pivot を張って navigate** に変更する。

- L0↔L1：`month-N` は俯瞰カード／月詳細に**無条件**で付いているため、`jumpPivot`/pivot を触らず navigate すれば自動でモーフする（実装時に要確認：既に月-N が両 DOM に揃うか）。
- L1↔L2：`pivotDay`（`day-zoom`）を「その日」でセットして navigate（既存 `openDayWeek` と同型）。
- L2↔L3：`dayPivot`（`hour-zoom`）を「その日」でセットして navigate（既存 `openDay` と同型）。

方向（前進/後退）は共有名が両 DOM に揃えば View Transitions が自動でモーフするため、追加のロジックは不要。

### 4.2 多段ジャンプ＝`jump-zoom`（日アンカー）
`CalendarApp` に `jumpPivot: {year,month,day} | null` を追加。多段ジャンプ時に `flushSync` で確定→navigate（既存 `dayPivot` と同じ「遷移キャプチャ前に反映」）。各ビューは `jumpPivot` を受け取り、§3 の要素に `viewTransitionName: "jump-zoom"` を付与する。
- L0/L1（`MonthCard`）：`jumpPivot` と一致する日セルに付与（既存の `pivot`（day-zoom）付与と同様の仕組みを流用・拡張）。
- L2（`WeekView`）：`jumpPivot` と一致する日ヘッダーに付与。
- L3（`DayView`）：外枠に付与（`hour-zoom` と排他：`jumpPivot` 時は `jump-zoom`）。

### 4.3 共有要素を1つに保つ（1ビュー1モーフ）
- **多段ジャンプ中は `month-N` を抑制**（俯瞰カード／月詳細の `viewTransitionName` を `jumpPivot` 非null時に `none`）。`day-zoom`/`hour-zoom` は `pivotDay`/`dayPivot` が null のため非出現。→ ジャンプ中の共有要素は `jump-zoom` の1つのみ。
- **隣接ジャンプ中は `jumpPivot` を張らない**（既存の該当 pivot のみ）。

### 4.4 状態ライフサイクル
- `jumpTo(level)`：ジャンプ距離を判定し、隣接なら該当 pivot（pivotDay/dayPivot）を、多段なら `jumpPivot` を `flushSync` で確定してから navigate。いずれの場合も他方の pivot は掃除する。
- ジャンプ以外の遷移（ドリルダウン click・前後移動・戻る）では `jumpPivot` を掃除する（既存 `pivotDay`/`dayPivot` の掃除方式＝`clearPivotThen`・`zoom.level` 監視 useEffect に倣う）。
- 詳細な掃除ポイントは実装計画で列挙する。

## 5. reduced-motion / 非対応

既存 `withTransition`（`prefers-reduced-motion: reduce` と `startViewTransition` 非対応で即時フォールバック）がそのまま担保。`globals.css` の `::view-transition-*` 定義も既存を流用。

## 6. テスト

| 種別 | 対象 |
|------|------|
| 単体（Vitest） | ドメイン変更なし（`resolveJumpTarget` 既存）。追加なし |
| 実機（Playwright） | View Transitions のモーフ中間フレームは捕捉不可のため、**各ジャンプで正しい共有要素が「その日」の要素1つだけに付与されるか**を `getComputedStyle(el).viewTransitionName` の DOM 検証で確認：①隣接ジャンプで該当 pivot（day-zoom/hour-zoom）が正しい日に付く ②多段ジャンプで `jump-zoom` が source/target の「その日」要素に付き、`month-N` が抑制される ③ドリルダウンの既存モーフが不変（回帰なし） |

見た目のズーム感（特に多段の小セル↔大ビュー）は**実機でユーザーと微調整**する前提。

## 7. 受け入れ基準

- [ ] 隣接ジャンプ（L0↔L1/L1↔L2/L2↔L3）が既存ドリルモーフと同じズームを起こす（前進・後退とも）
- [ ] 多段ジャンプ（L0↔L2/L0↔L3/L1↔L3）が「その日」に向かって `jump-zoom` でズームイン/アウトする
- [ ] ジャンプ中の共有要素は常に1つ（多段時 `month-N` 抑制／`day-zoom`・`hour-zoom` 非出現）
- [ ] カレンダー直接クリックのドリルダウン・モーフが不変（回帰なし）
- [ ] reduced-motion/非対応で即時フォールバック
- [ ] 全単体テスト緑・型チェック緑・静的ビルド成功・First Load JS < 150KB
