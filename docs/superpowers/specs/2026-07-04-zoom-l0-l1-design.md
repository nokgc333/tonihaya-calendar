# 設計: ズーム遷移 L0↔L1（俯瞰↔単月）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-04 |
| ステータス | 承認済み（実装前） |
| 対象 | tonihaya-calendar / ズーム遷移の第一増分 |
| 関連 | [仕様書 §6](../../仕様書.md) / [要件定義書 §5.2](../../要件定義書.md) |

## 1. 目的とスコープ

12ヶ月俯瞰（L0）から、月をクリックして単月（L1）へ**拡大ズーム**し、戻れるようにする。「とにかく速い」の看板体験（深入りの速さ）を最小増分で実現する。

**対象**: L0 ↔ L1 のみ。
**対象外（YAGNI）**: ピンチ/ジェスチャ、L2単日・L3時刻、六曜、設定パネル。

## 2. 状態モデルとURL

ズーム状態をURL検索パラメータで表現する（共有・ブラウザ戻る対応、仕様書§6.1準拠）。

| URL | レベル | 表示 |
|-----|--------|------|
| `/` または `/?y=2026` | L0 | 12ヶ月俯瞰（`y`省略時は今年） |
| `/?y=2026&m=7` | L1 | 2026年7月の単月 |

- `m` が無ければ L0、あれば L1。`y` は 1950–2150 にクランプ、`m` は 1–12。
- 静的エクスポート（`output: 'export'`）のまま実現。`/` の index.html をクライアントが読み、パラメータで描画を分岐する。直リンク `/?y=2026&m=7` の共有も可能。

### 純粋関数（TDD対象）
```
parseZoom(params: URLSearchParams, fallbackYear: number): ZoomState
zoomToQuery(state: ZoomState): string   // "?y=2026&m=7" / "?y=2026"
```
`ZoomState = { level: "overview" | "month"; year: number; month?: number }`

## 3. トランジション（View Transitions API）

- 月クリック時:
  ```
  if (startViewTransition 使用可 && !prefers-reduced-motion)
    document.startViewTransition(() => 状態をL1へ更新)
  else
    状態を即時更新
  ```
- クリックした月カードとL1の月コンテナに**同一の `view-transition-name`**（例 `month-7`）を付け、カードが単月へ拡大するモーフを実現する。
- 非対応ブラウザ／reduced-motion では即時切替にフォールバック（無害）。

## 4. 戻る操作

3系統すべてを L0 へのズームアウトに割り当てる。
- L1 の戻るボタン
- `ESC` キー
- ブラウザ戻る（`popstate`）

いずれも `history`（pushState/popstate）と同期し、URLと状態を一致させる。

## 5. コンポーネント構成

現 `Overview`（本日ヘッダー＋年ナビ＋12ヶ月グリッドを一体で持つ）を、ズーム対応のため薄く分割する。

```
CalendarApp（新・ルート client）
 ├─ 状態: today / year / zoom(level, month)  … useZoomState フック（URL⇄状態＋View Transitions）
 ├─ TodayHeader（新・共通）  … 本日表示＋遊びセクション（常時・本日基準）
 └─ 分岐:
     ├─ level=overview → OverviewBody（年ナビ＋12ヶ月グリッド。月カードは view-transition-name 付き・クリックでL1へ）
     └─ level=month    → MonthDetail（新・L1）
```

### MonthDetail（L1）
- 大きめ月グリッド（本日強調・土休色・祝日色）
- **祝日名インライン**表示
- **情報サイド（その月固有の事実のみ）**: その月の祝日一覧（日付＋名称）／月のサマリ（日数・祝日数）
  - 注: 本日基準の「週末/月末まで」は TodayHeader が常時担うため、ここには重複させない（今年以外の月で意味を成さないため）。
- 戻るボタン＋前月/次月送り
- 月ラベル「7月 / July / 文月」

## 6. ドメイン追加（TDD）

- `getHolidaysInMonth(year, month): Holiday[]` を `domain/holiday` に追加（`getHolidaysInYear` を月で絞る・純粋）。
- `buildMonthDetail(year, month, today, settings): { month: MonthView; holidays: Holiday[] }` を `domain/view` に追加。既存 `buildYearView` の月ビューと `getHolidaysInMonth` を再利用。
- `domain/view/zoom.ts` に `parseZoom` / `zoomToQuery`（純粋・テスト）。

## 7. テスト

| 種別 | 対象 |
|------|------|
| 単体（Vitest） | `parseZoom`/`zoomToQuery`、`getHolidaysInMonth`、`buildMonthDetail` |
| 実機（Playwright） | 月クリック→L1／URLが `&m=7` に更新／戻る3系統でL0復帰／直リンク `?y=&m=` 描画／reduced-motionフォールバック |

## 8. 影響範囲と非機能

- 既存の暦・祝日・遊びセクション・ビューモデルは再利用（変更最小）。
- 静的エクスポート維持、First Load JS 目標 <150KB を超えないこと（View TransitionsはネイティブでJS増分ほぼ無し）。
- アクセシビリティ: 戻るボタンにラベル、ESC対応、フォーカス管理（L1入場時に見出しへフォーカス）。

## 9. 受け入れ基準

- [ ] 俯瞰で月をクリックすると単月へ拡大遷移し、URLが `?y=&m=` になる
- [ ] 戻るボタン／ESC／ブラウザ戻る のいずれでも俯瞰へ戻る
- [ ] `/?y=2026&m=7` の直リンクで単月が直接表示される
- [ ] 単月に祝日名・情報サイド（その月の祝日一覧・月サマリ）が出る
- [ ] 非対応/reduced-motion で即時切替にフォールバック
- [ ] 全単体テスト緑・型チェック緑・静的ビルド成功
