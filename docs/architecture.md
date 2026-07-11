# アーキテクチャ & ファイル責務マップ — tonihaya-calendar

| 項目 | 値 |
|------|---|
| 更新日 | 2026-07-11 |
| 目的 | プロジェクト全体構造・各ファイルの責務・**手動カスタマイズの勘所**を1枚に集約する |
| 対象読者 | 保守・機能追加・細かい調整を手で行いたい人（＝あなた） |

---

## 1. 全体像

「12ヶ月を一望できる、とにかく速いカレンダー」。

- **技術**: Next.js 15（App Router）＋ React 19 ＋ TypeScript（strict）＋ Tailwind v4。
- **配信形態**: **完全な静的サイト**（`output: "export"` → `out/`）。サーバ・DB・認証・API を持たない。
- **状態の持ち方**: 表示状態（どのレベル/年月日を見ているか）は **URLクエリ**（`?y=&m=&d=&v=`）＝共有・ブラウザ戻る対応。予定データは **localStorage**（key `tonihaya.events`）。
- **ズーム階層**: L0 俯瞰(12ヶ月) → L1 月 → L2 週 → L3 日。相互に View Transitions でモーフ遷移。
- **配信先**: Vercel（本番 `https://tonihaya-calendar.vercel.app`）。

---

## 2. レイヤー構成

依存は**上から下への一方向**。下位（domain）は上位を知らない純粋層。

```
┌─────────────────────────────────────────────────────────┐
│ app/            Next.js エントリ（layout / page / 全体CSS）    │
├─────────────────────────────────────────────────────────┤
│ components/     UI（描画・操作）。React コンポーネント             │
│   CalendarApp ──(状態注入)── OverviewBody/MonthDetail/        │
│               WeekView/DayView + EventModal 等               │
├─────────────────────────────────────────────────────────┤
│ hooks/          React 状態・副作用（Context/localStorage/履歴）  │
│   useZoomState / useEvents / useEventEditor                 │
├─────────────────────────────────────────────────────────┤
│ data/           永続化（Repository パターン）                    │
│   EventRepository(IF) ← LocalStorageEventRepository          │
├─────────────────────────────────────────────────────────┤
│ domain/         純関数・型（I/Oなし・副作用なし・全てテスト対象）      │
│   calendar / view / event / holiday / countdown /           │
│   timecalc / shared                                         │
└─────────────────────────────────────────────────────────┘
```

**設計の要点**
- **domain は完全な純関数**（`Date` すら持ち込まず素の数値で扱う）。→ 高速・決定論的・テスト容易。
- **副作用は hooks/data に隔離**。`EventRepository` インターフェースで保存先を抽象化（将来 Supabase 差し替え可、テストは in-memory 注入）。
- **表示状態＝URL**。`parseZoom`/`zoomToQuery` が URL ⇄ 状態を相互変換。

---

## 3. ファイル別責務（全ファイル）

### app/（Next.js エントリ）
| ファイル | 行 | 責務 |
|---------|----|------|
| `app/page.tsx` | 5 | ルートページ。`CalendarApp` を描画するだけ |
| `app/layout.tsx` | 37 | HTMLシェル（`lang=ja`・metadata・themeColor）＋ Speed Insights 埋め込み |
| `app/globals.css` | 152 | Tailwind 読込＋**CSSトークン定義**（配色 `--surface`/`--border`/`--ev-*` 等・light/dark）＋View Transitions のアニメ定義 |

### components/（UI）
| ファイル | 行 | 責務 |
|---------|----|------|
| `CalendarApp.tsx` | 296 | **アプリの司令塔**。`useZoomState` を束ね、レベルに応じて OverviewBody/MonthDetail/WeekView/DayView を出し分け。ズームのピボット（pivotDay/dayPivot/jumpPivot）と遷移方向を管理。`EventProvider`/`EventEditorProvider` を提供 |
| `OverviewBody.tsx` | 152 | **L0 俯瞰**。12ヶ月グリッド（3×4 / 4×3 切替）。`MonthCard(size=sm)` を並べる。年の前後移動・年入力 |
| `MonthCard.tsx` | 335 | **月カード**（L0の1枚＝sm、L1単月＝lg 兼用）。週×7セルのグリッド、当日リング、L1チップ（最大3＋「+N件」）/L0ドット、day-zoom 複製オーバーレイ |
| `MonthDetail.tsx` | 196 | **L1 単月ビュー**。`MonthCard(size=lg)` ＋ ナビ（前後月・レベルジャンプ・設定） |
| `WeekView.tsx` | 292 | **L2 週ビュー**。曜日ヘッダ＋終日行＋24h時間グリッド。時間イベントを絶対配置、今ライン、当日自動スクロール |
| `DayView.tsx` | 228 | **L3 日ビュー**。単日の24h時間グリッド。前後日移動 |
| `DayTimedEvents.tsx` | 67 | 時間イベントを時刻グリッド上に絶対配置する層（L2/L3共用）。重なりを列分割して横並び |
| `EventModal.tsx` | 263 | **予定の作成/編集モーダル**。フォーム（タイトル/終日/日時/色/優先度/URL/備考）＋バリデーション表示＋保存/削除。URL安全リンク描画 |
| `EventChip.tsx` | 35 | L1月セル等の1件チップ（時刻＋タイトル、クリックで選択） |
| `AddEventButton.tsx` | 20 | 「＋予定」ボタン。`useEventEditor` の新規作成を開く |
| `TodayHeader.tsx` | 36 | 画面上部の「今日」見出し＋カウントダウン表示 |
| `CountdownChips.tsx` | 76 | 週末/月末/年末等までのカウントダウンチップ |
| `LevelSwitcher.tsx` | 45 | 「年/月/週/日」セグメント。任意レベルへ1クリックジャンプ |
| `SettingsMenu.tsx` | 91 | 歯車→ポップオーバー。週開始（日/月）切替（localStorage永続） |
| `SegmentButton.tsx` | 35 | セグメント/レイアウトボタンの共通装飾コンポーネント |
| `eventColors.ts` | 25 | イベント色キー → CSSトークン（`--ev-*`）解決。色キー一覧 `EVENT_COLOR_KEYS` |
| `dayPalette.ts` | 24 | 曜日・祝日に応じたセル背景/文字色（土=青・日祝=赤 等） |
| `weekdays.ts` | 2 | 曜日ラベル配列（日本語） |

### hooks/（状態・副作用）
| ファイル | 行 | 責務 |
|---------|----|------|
| `useZoomState.ts` | 61 | **表示状態の州機械**。URL⇄状態（`parseZoom`/`zoomToQuery`）、`history.pushState`/`popstate`、View Transitions＋reduce-motion 分岐 |
| `useEvents.tsx` | 93 | **予定データの状態**。`EventProvider`＋`useEvents`。CRUD＋楽観更新（保存成功時のみ反映）。`repository?` 注入可 |
| `useEventEditor.tsx` | 74 | **モーダル開閉の州**。`EventEditorProvider`＋`useEventEditor`。新規/編集を開き、`EventModal` を配置、保存/削除を `useEvents` に橋渡し |

### data/（永続化）
| ファイル | 行 | 責務 |
|---------|----|------|
| `data/eventRepository.ts` | 9 | **`EventRepository` インターフェース**（list/add/update/remove）。UI/domain はこれにのみ依存 |
| `data/localStorageEventRepository.ts` | 49 | localStorage 実装。`JSON.parse` を型ガード（`isStoredCalendarEvent`）で防御、保存失敗を再throw |

### domain/（純関数・型）
| ファイル | 行 | 責務 |
|---------|----|------|
| `domain/shared/date.ts` | 37 | 暦の基礎（`weekdayOf`/`toEpochDay`/`fromEpochDay`/`daysInMonth`）。`CivilDate` 型 |
| `domain/calendar/grid.ts` | 59 | 月グリッド生成（`getMonthGrid`）・閏年・月日数 |
| `domain/calendar/types.ts` | 19 | 暦関連の型（`WeekStart` 等） |
| `domain/event/types.ts` | 33 | `CalendarEvent`/`EventPoint`/`EventColorKey`/`EventPriority` 型 |
| `domain/event/event.ts` | 165 | **イベントの中核ロジック**。`eventsForDay`/`clipEventToDay`/`layoutDayColumns`(重なり列分割)/`sortForDay`/`validateEvent`/`isSafeUrl`/`isStoredCalendarEvent` |
| `domain/view/zoom.ts` | 40 | URL⇄`ZoomState`（`parseZoom`/`zoomToQuery`）。パラメータ検証 |
| `domain/view/yearRange.ts` | 18 | 対応年 `MIN_YEAR=1950`/`MAX_YEAR=2150`・`clampYear`・`resolveYearInput` |
| `domain/view/yearView.ts` | 101 | 年/月の描画ビューモデル生成（`buildYearView`/`buildMonthView`）。`MonthView`/`YearView`/`DayCell` 型 |
| `domain/view/weekView.ts` | 67 | 週ビューモデル（`buildWeekView`）・時刻→px（`minutesToOffset`） |
| `domain/view/dayView.ts` | 39 | 日ビューモデル（`buildDayView`） |
| `domain/view/monthDetail.ts` | 77 | L1単月の詳細ビューモデル（`buildMonthDetail`） |
| `domain/view/jumpTarget.ts` | 29 | レベルジャンプ先の解決（`resolveJumpTarget`） |
| `domain/holiday/holiday.ts` | 115 | 日本の祝日判定（`getHoliday`/`isHoliday`/年月別一覧）。春分秋分近似含む |
| `domain/countdown/countdown.ts` | 36 | 週末/月末/年末等へのカウントダウン計算（`getCountdowns`） |
| `domain/timecalc/timecalc.ts` | 72 | 時間・日数計算（`addDurationToTime`/`diffTime`/`addDays`/`diffDays` 等）。※UI未露出（backlog） |

### テスト・設定
| ファイル | 責務 |
|---------|------|
| `vitest.config.ts` | vitest 設定（JSX automatic・tsx include・setup・coverage=domain） |
| `vitest.setup.ts` | jest-dom 登録・VTモック・crypto フォールバック（ランタイム） |
| `src/vitest.d.ts` | jest-dom マッチャの型を tsc へ適用 |
| `.lighthouserc.cjs` | LHCI 速度予算（script/total サイズ・perf warn） |
| `.github/workflows/ci.yml` | CI（verify＝型/テスト/ビルド ＋ lighthouse＝サイズ予算） |
| `next.config.mjs` | `output:"export"`・画像最適化オフ・strict mode |

---

## 4. 主要データフロー

### (A) 予定の CRUD
```
ユーザー操作（＋予定 / チップクリック）
  → useEventEditor.openCreate/openEdit（モーダル状態）
  → EventModal（入力＋validateEvent）
  → onSubmit → useEvents.addEvent/updateEvent（楽観更新）
  → EventRepository.add/update（localStorage）※失敗時は楽観更新せず
  → 各ビューが useEvents.events を eventsForDay/sortForDay で整形して再描画
```

### (B) ズーム/ナビゲーション状態
```
URL（?y=&m=&d=&v=） ⇄ parseZoom/zoomToQuery ⇄ useZoomState.zoom
  navigate() → setZoom + history.pushState + View Transition
  ブラウザ戻る → popstate → parseZoom → setZoom（VT付き）
CalendarApp が zoom.level で OverviewBody/MonthDetail/WeekView/DayView を出し分け
```

### (C) 永続化の防御
```
localStorage 読込 → JSON.parse(try/catch) → Array.isArray → isStoredCalendarEvent で要素フィルタ
localStorage 書込 → setItem(try/catch) → 失敗は console.error + rethrow
```

---

## 5. 手動カスタマイズの勘所（「ここを触ればこう変わる」）

> よくある調整を、対象ファイル・定数とセットで示す。

| 変えたいこと | 触る場所 |
|-------------|---------|
| **イベントの色** | `app/globals.css` の `--ev-*` トークン（bg/fg/border・light/dark）。色キー自体の増減は `domain/event/types.ts` の `EventColorKey` ＋ `components/eventColors.ts` `EVENT_COLOR_KEYS` |
| **曜日・祝日のセル配色** | `components/dayPalette.ts`（土=青/日祝=赤 等）。全体の面色は `globals.css` の `--surface`/`--border` |
| **L1月セルのチップ表示数（「+N件」の閾値）** | `components/MonthCard.tsx` の `MAX_CHIPS`（現状3） |
| **L0/L1のセル高さ・文字サイズ** | `components/MonthCard.tsx` の `SIZE`（sm/lg）・`RESERVED_WEEK_ROWS`（常時6週確保） |
| **週/日ビューの1時間の高さ・自動スクロール位置** | `components/WeekView.tsx`（`DayView.tsx`）の `HOUR_HEIGHT`・`SCROLL_LEAD_HOURS` |
| **対応年の範囲** | `domain/view/yearRange.ts` の `MIN_YEAR`/`MAX_YEAR` |
| **週の開始曜日の既定** | `components/SettingsMenu.tsx`（UI）／初期値は `CalendarApp.tsx` の `weekStart` state。永続キー `tonihaya.weekStart` |
| **祝日の定義・追加** | `domain/holiday/holiday.ts`（判定ロジック）。現状は計算＋テーブル |
| **カウントダウンの対象** | `domain/countdown/countdown.ts` `getCountdowns` |
| **レベル遷移の速度・アニメ** | `app/globals.css` の `::view-transition-*`（root 200ms／group 200ms／ズーム元 old 100ms）。※順序感delayは速度優先で不採用確定 |
| **遷移方向の分岐・ピボット** | `components/CalendarApp.tsx` の `jumpTo`/`openDayWeek`/`openDay`（pivotDay/dayPivot/jumpPivot） |
| **URLクエリの形（共有リンク）** | `domain/view/zoom.ts` `zoomToQuery`/`parseZoom` |
| **予定の保存先（localStorage→他へ）** | `data/eventRepository.ts`（IF）に沿って新実装を作り、`EventProvider repository={...}` に注入 |
| **速度予算（CIで落ちる閾値）** | `.lighthouserc.cjs` の `resource-summary:script:size`/`total:size` |
| **バリデーション規則・エラー文言** | `domain/event/event.ts` `validateEvent` |

---

## 6. 拡張時の指針

- **新しいビュー/表示の追加**: まず `domain/view/` に純関数のビルダーを作り（テスト先行）、その後 `components/` で描画。副作用は持ち込まない。
- **新しい永続化先（例: Supabase）**: `EventRepository` を実装した新クラスを `data/` に作り、`EventProvider` に注入。UI/domain は無改修（インターフェース不変）。
- **状態を増やす前に**: 「URLに載せるべき表示状態か / localStorage のデータか / 一時的なUI状態か」を区別する（本アプリの状態設計の背骨）。
- **セキュリティ**: `dangerouslySetInnerHTML` を使う場合はサニタイズ必須。外部スクリプト追加時は CSP（`docs/security-audit-2026-07-11.md` §4 M-1）を併せて更新。

---

*このドキュメントは静的コードレビューに基づく。実装変更時は本書の責務表・カスタマイズ表を追随更新すること。*
