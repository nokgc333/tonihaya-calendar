# 設計: ズームアンカーの対象化（day-zoom / hour-zoom を「その日の見出し」に定める）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-08 |
| ステータス | 承認済み（実装前） |
| 対象 | tonihaya-calendar / レベル遷移のズームモーフ |
| 関連 | [ジャンプ・ズーム遷移設計](./2026-07-07-jump-zoom-transition-design.md) / L2週間・L3日間設計（ズームモーフ） |

## 1. 背景と問題

`feat/jump-zoom-transition` で、隣接ジャンプ（L1↔L2 / L2↔L3）に既存ドリルモーフ（`day-zoom` / `hour-zoom`）を流用した。実機確認で **View Transition 自体は正しく走る**（Playwright 計測で `day-zoom` / `hour-zoom` が before/after にペア成立、skip なし）ことを確認済み。

しかしユーザー実機で **「押下した箇所がズームされすぎて違和感」** という体感課題が判明した。原因は、モーフのアンカーが「小さな要素（L1 の日セル / L2 の日ヘッダー）」と「大きなビュー外枠全体（週ビュー全幅 / 日ビュー）」のペアになっており、拡大元の小要素画像が巨大化＋方向が「その日」に定まらないため。

## 2. 目的とスコープ

**目的**: モーフのアンカーを「大きなビュー外枠」から「その日の見出し要素」へ付け替え、**方向を対象（その日）に定め、拡大を控えめにする**（ユーザー選択＝「方向を対象に定める」）。

**スコープ内**:
- `day-zoom`（L1↔L2）の **L2 側アンカー**を、週ビュー外枠 → **該当日ヘッダー**へ。
- `hour-zoom`（L2↔L3）の **L3 側アンカー**を、日ビュー外枠 → **日付ヘッダーバー**へ。
- ドリルダウン・ジャンプ双方に一貫適用（同一の共有要素機構のため分岐しない）。

**スコープ外（YAGNI）**:
- 多段ジャンプの `jump-zoom`（外枠アンカーのまま）。今回の不満対象は隣接ジャンプであり、多段は別課題。
- `month-N`（L0↔L1）。ユーザー確認済みで違和感なし。
- アニメーション時間・fade timing のカスタム（今回は「方向＝アンカー付け替え」のみで対応。必要なら別途）。

## 3. 現状のアンカー（前提）

| モーフ | source 要素 | target 要素（現状） | 付与箇所 |
|--------|------------|--------------------|----------|
| `day-zoom`（L1↔L2） | L1 押下日セル（`MonthCard`, `pivotDay` 一致セル） | **週ビュー外枠全体**（`WeekView`） | `WeekView` 外枠 `viewTransitionName: dayPivot ? "none" : "day-zoom"` |
| `hour-zoom`（L2↔L3） | L2 該当日ヘッダー button（`WeekView`, `dayPivot` 一致） | **日ビュー外枠全体**（`DayView`） | `DayView` 外枠 `viewTransitionName: jumpPivot ? "jump-zoom" : "hour-zoom"` |

`WeekView` は現状 `dayPivot`（`hour-zoom` 用）と `jumpPivot`（`jump-zoom` 用）は受け取るが、**`pivotDay`（`day-zoom` 用）は受け取っていない**（L2 側の day-zoom は外枠が担っていたため）。

## 4. 変更後のアンカー

| モーフ | source | target |
|--------|--------|--------|
| `day-zoom`（L1↔L2） | **L1 の押下日が属する週の行**（MonthCard の週ラッパー。実機微調整の結果、当初の「押下日セル1つ」から「その週の行」へ変更） | **L2 の週ヘッダー行全体**（sticky 曜日+日付行。当初の「該当日ヘッダー1つ」から「ヘッダー行全体」へ変更） |
| `hour-zoom`（L2↔L3） | L2 該当日ヘッダー button | **L3 の sticky 日付ヘッダーバー** |

> 「その週の行」を source にするため、MonthCard の月グリッドを平坦な7列グリッドから「週ごとの行ラッパー（`grid-cols-subgrid` で列を継承）」に組み替える。L0俯瞰の12枚カードとも共有するため、レイアウト回帰をスクリーンショット比較で検証する（L0/L1 とも既存と一致を確認済み）。day-zoom は押下日が属する週ラッパーにのみ付与し、`jump-zoom`（多段の起点）は従来通り個別セルに残す。

周囲のグリッド本体（週グリッド・日グリッド）は名前を持たず root クロスフェードで現れる。モーフは常に「その日の見出し ↔ その日の見出し」となり、方向が対象に定まり拡大が控えめになる。

## 5. 実装方針（3ファイル・DOMのみ）

ドメインロジック・テスト（Vitest）変更なし。`viewTransitionName` の付与箇所のみ変更。

### 5.1 `src/components/WeekView.tsx`
- props に `pivotDay: { readonly year:number; readonly month:number; readonly day:number } | null` を追加（`dayPivot` の隣）。分割代入にも追加。
- L1↔L2 遷移中フラグ `isDayZoom` を追加（`pivotDay` は L2↔L3 遷移後も残存し得るため `dayPivot`/`jumpPivot` が null のときに限定する）:
  ```tsx
  const isDayZoom = pivotDay !== null && dayPivot === null && jumpPivot === null;
  ```
- **外枠**の `viewTransitionName: dayPivot ? "none" : "day-zoom"` を **除去**（`viewTransitionName` を付けない＝root）。border 等の他 style は維持。コメントも更新。
- **週ヘッダー行**（sticky 曜日+日付行 `<div className="sticky top-0 z-10 grid shrink-0 pb-1.5" ...>`）の `style` に `viewTransitionName: isDayZoom ? "day-zoom" : undefined` を付与（押下日→週ヘッダー行全体へモーフ）。
- **日ヘッダー button** の `style` は `hour-zoom`（`isPivot`）/`jump-zoom`（`isJump`）のみに（`day-zoom` は button ではなくヘッダー行が担う）:
  ```tsx
  style={
    isPivot(d)
      ? { viewTransitionName: "hour-zoom" }
      : isJump(d)
        ? { viewTransitionName: "jump-zoom" }
        : undefined
  }
  ```

### 5.2 `src/components/DayView.tsx`
- **外枠**の `viewTransitionName: jumpPivot ? "jump-zoom" : "hour-zoom"` を `viewTransitionName: jumpPivot ? "jump-zoom" : undefined` に変更（`hour-zoom` を外枠から除去）。コメント（「L2の日カラムからのモーフ着地点」）を更新。
- **sticky 日付ヘッダーバー**（現行 `<div className="sticky top-0 z-10 grid min-h-[54.5px] ...">`）に `viewTransitionName: jumpPivot ? undefined : "hour-zoom"` を付与（多段時は外枠が `jump-zoom` を持つのでヘッダーは無名にし二重付与を避ける）。既存の `gridTemplateColumns`/`background` style は維持。

### 5.3 `src/components/CalendarApp.tsx`
- `<WeekView …>`（week 分岐）に `pivotDay={pivotDay}` を1行追加。他は不変。

## 6. 相互排他性（衝突しないことの担保）

各遷移で `WeekView` の日ヘッダーが持つ名前は1つに定まる:
- ドリルダウン L1→L2 / ジャンプ L1↔L2: `pivotDay` セット・`dayPivot` null・`jumpPivot` null → `day-zoom`。
- ドリルダウン L2→L3 / ジャンプ L2↔L3: `dayPivot` セット・`pivotDay` null → `hour-zoom`（`isPivot` 優先）。
- 多段ジャンプ: `jumpPivot` セット・他 null → `jump-zoom`。

`jumpTo` は距離分岐で `pivotDay` / `dayPivot` / `jumpPivot` のうち1つだけを立て他を掃除する（実装済み）。ドリルダウン系ハンドラ（`openDayWeek` / `openDay`）も同様。したがって同一スナップショット内で同名要素が複数化することはない。

## 7. テスト

| 種別 | 対象 |
|------|------|
| 単体（Vitest） | 変更なし（ドメイン不変）。116テスト緑を維持 |
| 実機（Playwright） | View Transition のモーフ中間フレームは捕捉不可のため、遷移直前/直後の DOM で共有要素名を検証（`startViewTransition` をラップし before/after のスナップショットと `ready`/`finished` を計測）。①L1↔L2 で `day-zoom` が L1 セル・L2 該当日ヘッダーに各1つ・skip なし ②L2↔L3 で `hour-zoom` が L2 ヘッダー・L3 日付ヘッダーバーに各1つ・skip なし ③外枠に `day-zoom`/`hour-zoom` が付かない ④多段 `jump-zoom` が不変（回帰なし） |
| 実機（ユーザー） | 各ジャンプ/ドリルのズーム体感を確認。方向が対象に定まり・拡大が控えめになったか |

## 7.5 着地側の穴対策：day-zoom は「複製オーバーレイ」に張る

day-zoom の source を「押下日が属する週の行」（MonthCard の週ラッパー）にした副作用として、**戻り(L2→L1)方向で着地側にグレーの穴**が出る問題が判明した。原因は、View Transition が名前付き要素（週ラッパー）を root から「持ち上げる」ため、**着地側スナップショット（root-new）の該当週が抜けてグリッド背景色（`var(--border)`＝グレー）の穴になる**こと。モーフ要素が着地する（≒100%）まで穴が見え続ける。root-new を分離した実機スクショで確定（subgrid/grid-cols-7 とは無関係）。

対策: **`day-zoom` を「本物の週の行」ではなく、その上に重ねた複製オーバーレイに張る**。本物の週は無名のまま root に残り遷移中ずっと表示される（穴が出ない）一方、複製が持ち上がって L2 週ヘッダー行へモーフする。進む・戻る両方向でズームが成立する。

- `MonthCard`：pivot 週は本物の行（無名）＋ `absolute inset-0` の複製オーバーレイ（`aria-hidden`・`pointer-events-none`・`viewTransitionName:"day-zoom"`）を重ねる。オーバーレイは本物にピクセル一致で重なるため静止時の二重表示は無し（実機確認）。複製の列トラックは `grid-cols-subgrid` だとスナップショットで潰れるため **`grid-cols-7`** で自己完結させる。クリックは本物へ通す。
- `jumpTo` の L1↔L2 分岐は進む・戻る両方向で `setPivotDay(anchorDay)`（穴は上記オーバーレイで防ぐため方向分岐は不要）。`WeekView.onBack` も `pivotDay` を掃除しない。
- 検証：root-new を分離した実機スクショで戻り時に該当週が残る（穴なし）ことを確認。before/after の `day-zoom` は「複製オーバーレイ ↔ 週ヘッダー行」でペア成立・skip なし。

## 8. 既知のエッジケース

- 週送り（`shiftWeek`）で `pivotDay` の日が表示週外に出た状態で L2→L1（「月」ジャンプ/戻る）した場合、L2 側に該当日ヘッダーが存在せず `day-zoom` が付かない → クロスフェードにフォールバック。稀なパスであり許容。

## 9. 受け入れ基準

- [ ] L1↔L2 ジャンプ/ドリルで、押下日が属する週の行 ↔ L2 週ヘッダー行全体が `day-zoom` でモーフ（拡大控えめ・方向が定まる）
- [ ] MonthCard の週ラッパー化で L0/L1 のレイアウトが既存と一致（回帰なし）
- [ ] L2↔L3 ジャンプ/ドリルで、L2 該当日ヘッダー ↔ L3 日付ヘッダーバーが `hour-zoom` でモーフ
- [ ] 週ビュー/日ビュー外枠に `day-zoom`/`hour-zoom` が付かない（root クロスフェードで周囲が現れる）
- [ ] 多段ジャンプ `jump-zoom`・L0↔L1 `month-N` が不変（回帰なし）
- [ ] reduced-motion/非対応で即時フォールバック（既存 `withTransition` 不変）
- [ ] 全単体テスト緑・型チェック緑・静的ビルド成功・First Load JS < 150KB
- [ ] ユーザー実機で「ズームされすぎ」の違和感が解消
