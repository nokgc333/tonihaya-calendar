# 設計: 設定パネル（週開始）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-07 |
| ステータス | 承認済み（実装前） |
| 対象 | tonihaya-calendar / 週開始曜日の設定 |
| 関連 | [レベルジャンプ設計](./2026-07-06-level-jump-switcher-design.md) |

## 1. 目的とスコープ

全レベル（L0/L1/L2/L3）の nav に**歯車アイコン→設定ポップオーバー**を常設し、**週開始（日曜/月曜）**を切り替えられるようにする。設定は localStorage で永続化し、L0俯瞰カード・L1月詳細・L2週ビューへ一貫反映する。

**対象**: 週開始設定 1つ。
**対象外（YAGNI）**: 週開始以外の設定、土曜始まり（ドメイン拡張が必要）、L3への視覚反映（単一日のため無関係）。将来の設定追加はポップオーバーの器を再利用する。

## 2. 週開始の選択肢

`WeekStart = "sun" | "mon"`（`src/domain/calendar/types.ts` 既存）に従い **日曜／月曜のみ**。ドメイン（`getMonthGrid`/`buildYearView`/`buildMonthDetail`/`buildWeekView`）は既に `weekStart` を受け取り切替対応済み。現状は呼び出し側4箇所でハードコード `"sun"`。

## 3. 状態・永続化

`CalendarApp` に `weekStart` 状態を追加。**既存の `overviewLayout` と同じパターン**で永続化する:

- localStorage キー `tonihaya.weekStart`、既定 `"sun"`
- 初回 `useEffect` で読込（`"sun"`/`"mon"` のみ受理）、変更時に `setItem`
- SSR/初期化整合のため、既定 `"sun"` で初期レンダリング→クライアントで localStorage 反映（`overviewLayout` と同挙動）

ハードコード `"sun"` を `weekStart` に差し替える箇所:
- `OverviewBody.tsx`: `buildYearView(year, today, { weekStart })` と `<MonthCard … weekStart={weekStart} />`
- `MonthDetail.tsx`: `buildMonthDetail(year, month, today, { weekStart })` と `<MonthCard … weekStart={weekStart} />`
- `WeekView.tsx`: `buildWeekView(year, month, day, today, { weekStart })`

## 4. コンポーネント `SettingsMenu`

`src/components/SettingsMenu.tsx`（新規）:

- props: `{ weekStart: WeekStart; onWeekStartChange: (w: WeekStart) => void }`
- **歯車ボタン**（環境差の出ない**インラインSVG**の歯車・`stroke: currentColor`＋トークン色）＋開閉状態 `useState`
- **ポップオーバー**（歯車の下に絶対配置・`z` 高め・`--surface-2`＋`--border` の角丸ボックス）に「週開始」ラベル＋`SegmentButton` の `日|月` トグル（active=現在値）
- **閉じる挙動**: 外側クリック（document mousedown リスナ）／`Escape`。`useEffect` でリスナ登録・クリーンアップ
- アクセシビリティ: 歯車 `aria-label="設定"` `aria-expanded`、ポップオーバー `role="dialog"` 相当。トグルは `aria-current`（現在値）

## 5. 配置

- 各 nav の右クラスタで **LevelSwitcher の左隣**に歯車を置く（LevelSwitcher は右端のまま＝直近の配置統一を維持）。
- L0（OverviewBody）: 右クラスタは `[レイアウト切替(≥1288px)] [歯車] [LevelSwitcher]`。
- L1/L2/L3: `[歯車] [LevelSwitcher]`。
- L3 も一貫性のため歯車を表示（週開始は L3 の見た目に影響しないが、グローバル設定として他ビューに反映）。

## 6. 配線

`CalendarApp` が `weekStart` 状態＋`onWeekStartChange` を所有し、`onJump` と同様に各ビュー（OverviewBody/MonthDetail/WeekView/DayView）へ渡す。各ビューは:
- nav に `<SettingsMenu weekStart={weekStart} onWeekStartChange={onWeekStartChange} />` を LevelSwitcher の左に描画
- 自身の build 呼び出し／MonthCard に `weekStart` を渡す（L3=DayView は build に週概念が無いので設定の受け渡しのみ）

## 7. 反映範囲

| ビュー | 反映 |
|--------|------|
| L0 俯瞰 | 各月カードの曜日ヘッダー並び＋日グリッドの開始曜日 |
| L1 月詳細 | 月カード（同上） |
| L2 週ビュー | 週の開始曜日（列の並び） |
| L3 日ビュー | 影響なし（単一日）。歯車は表示 |

## 8. テスト

| 種別 | 対象 |
|------|------|
| 単体（Vitest） | ドメインの weekStart 切替は既存テストで担保（追加なし）。`SettingsMenu` は純描画のため単体なし |
| 実機（Playwright） | 歯車→ポップオーバー開閉／Esc・外側クリックで閉じる／日→月切替で L0・L1 の曜日ヘッダーが「月…日」並びに・L2週が月曜始まりに／**リロードで設定維持**（localStorage）／既定が日曜 |

## 9. 受け入れ基準

- [ ] 全レベルの nav に歯車→ポップオーバーがあり、週開始 日/月 トグルがある
- [ ] 切替が L0/L1/L2 に一貫反映（曜日ヘッダー・グリッド・週列）、L3 は無害
- [ ] localStorage で次回起動も維持、既定は日曜
- [ ] ポップオーバーが外側クリック／Esc で閉じる
- [ ] 歯車は LevelSwitcher の左隣（LevelSwitcher は右端維持）
- [ ] 全単体テスト緑・型チェック緑・静的ビルド成功・First Load JS < 150KB
