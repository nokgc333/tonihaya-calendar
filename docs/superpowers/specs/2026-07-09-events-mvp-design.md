# 設計: イベント/予定機能 MVP（v0.2.0）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-09 |
| ステータス | 草案（レビュー待ち） |
| 対象 | tonihaya-calendar / 予定の表示・作成・編集・削除 |
| 関連 | L0俯瞰/L1月/L2週/L3日 各ビュー、`domain/shared/date`（CivilDate）、`domain/timecalc`（TimeOfDay） |

> 本書は A-0-1〜A-0-4 の対話で確定した方針を仕様化したもの。§7・§8 の"見せ方"は Google カレンダー準拠のデフォルト提案であり、レビューで調整する。

## 1. 目的とスコープ

**目的**: 12ヶ月俯瞰カレンダーに「予定（イベント）」の表示・作成・編集・削除を追加し、実用アプリにする。差別化＝体感速度を維持するため MVP は**完全静的（localStorage）**で構築する。

**MVPスコープ（入れる）**
- 予定の CRUD（作成・表示・編集・削除）
- 終日イベント／時間イベントの両方
- 複数日にわたる予定（開始日〜終了日の範囲。B方式＝範囲をデータで持ち各日に表示）
- 時間イベントの複数日（日別クリップで各日に切り出し表示）
- 8色パレット（淡め）・優先度・URL・備考・作成/更新時刻
- L0〜L3 各ビューでの表示
- 重なり時の Google 風横並びレイアウト

**スコープ外（将来）**
- 繰り返し（毎週/毎月）、通知、場所、添付、他ユーザー共有、アカウント/認証、複数端末同期（Supabase 導入時）

## 2. データモデル

```ts
// DOM の Event と衝突を避け CalendarEvent とする
type EventColorKey = "blue" | "green" | "teal" | "purple" | "pink" | "amber" | "slate" | "rose"; // 8色・淡め
type EventPriority = "low" | "normal" | "high";

interface EventPoint {
  readonly date: CivilDate;        // domain/shared/date の共通型を再利用
  readonly time?: TimeOfDay;       // domain/timecalc の {hour,minute}。時間イベント時のみ
}

interface CalendarEvent {
  readonly id: string;             // crypto.randomUUID()
  readonly title: string;          // 必須（空不可）
  readonly allDay: boolean;
  readonly start: EventPoint;
  readonly end: EventPoint;        // end >= start（終日/時間とも複数日可）
  readonly colorKey: EventColorKey;
  readonly priority: EventPriority; // 既定 "normal"
  readonly url?: string;           // 任意。描画時に http/https のみ許可・サニタイズ（§10）
  readonly note?: string;          // 任意
  readonly createdAt: number;      // epoch ms
  readonly updatedAt: number;      // epoch ms
}
```

**不変条件**
- `title` は trim 後 1文字以上。
- 時間イベント（`allDay === false`）: `start.time`/`end.time` 必須。
- 同日内: `end.time > start.time`。複数日: `end.date > start.date`（この場合の時刻は日をまたぐ）。
- 終日（`allDay === true`）: `time` は持たない。`start.date <= end.date`。
- 素の値（数値・文字列）のみ＝シリアライズ容易・Supabase 移行が楽。`Date` 型は持たない。

## 3. 永続化（repository パターン）

```ts
interface EventRepository {
  list(): Promise<readonly CalendarEvent[]>;
  add(event: CalendarEvent): Promise<void>;
  update(event: CalendarEvent): Promise<void>;
  remove(id: string): Promise<void>;
}
```

- **MVP 実装**: `LocalStorageEventRepository`（`src/data/`）。キー `tonihaya.events` に JSON 配列で保存。同期処理を `Promise.resolve()` で包んで非同期IFに合わせる。
- **将来**: `SupabaseEventRepository` を追加するだけで UI/ドメイン無変更（同期・認証・サーバ保管はこの時点で解決）。
- **件数前提**: 個人用途で少数 → MVP は `list()` 全件取得してクライアントで絞り込み。スケール時にクエリ追加。
- **消失対策（後日）**: 設定パネルに JSON エクスポート/インポート（手動バックアップ）。MVP後の小タスク。

## 4. ドメインロジック（純関数 `src/domain/event/event.ts`）

| 関数 | 役割 |
|------|------|
| `eventsForDay(events, date)` | その日を含むイベント（`start.date ≤ date ≤ end.date`）を返す |
| `clipEventToDay(event, date)` | 時間イベントをその日ぶんに切り出す。返り値: `{ startMin, endMin, continuesFromPrev, continuesToNext }`。当日開始なら `start.time`、以前開始なら 0:00 から。当日終了なら `end.time`、以降終了なら 24:00 まで |
| `layoutDayColumns(segments)` | **Google 風の横並びレイアウト**。重なる時間イベント群を列（レーン）に割り当て、各セグメントに `{ columnIndex, columnCount }` を付与して幅・左位置を算出可能にする |
| `sortForDay(events)` | 表示順: 終日→時間、開始時刻昇順、同時刻は優先度（high→low）→ createdAt |

- すべて純関数・`event.test.ts` で TDD（重なりレイアウトは境界ケースを重点）。

## 5. 状態注入（Context + フック）

- `EventProvider`（`src/components` or `src/hooks`）: マウント時に `repository.list()` で読み込み、メモリにキャッシュ。
- `useEvents()`: `{ events, add, update, remove, loading }` を返す。CRUD は repository を呼びつつローカルキャッシュを楽観更新。
- ビュー（L0〜L3）は `useEvents()` から配列を受け取り、ドメイン純関数で当日/当週分に整形して描画。

## 6. 色パレット（8色・淡め）

- `globals.css` に 8色 × (文字色/背景色) のCSSトークンを light/dark 両対応で追加。
- **既存の祝日/土日色（`--accent-red` / `--accent-sat` / `--sun-bg` / `--sat-bg`）と明確に区別できる淡い彩度**にする（土日セルの上に乗っても判読可能）。
- データは `colorKey`（"blue"等）のみ保持し、描画時にトークンへ解決（テーマ追従・将来変更に強い）。

## 7. 表示仕様（各レベル）★デフォルト提案（要レビュー）

| レベル | 表示 |
|--------|------|
| **L0 俯瞰** | 各日セルに「予定ありインジケータ（小さな点・イベント色）」。最大3点まで、超過は点のみ密度で表現。パフォーマンス優先で軽量に |
| **L1 月** | 日セルにチップ（`● タイトル`）。1セル最大 **3件**、超過は「**+N件**」。終日/複数日は帯風チップ、時間イベントは時刻付きチップ。クリックで詳細 |
| **L2 週** | 上部「終日/複数日」行に各日のチップ（B方式で範囲の各日に表示）。時刻グリッドに時間イベントを配置（`layoutDayColumns` で横並び）。複数日時間イベントは日別クリップ＋継続印（‹ ›） |
| **L3 日** | 「終日」行＋時刻グリッド（横並びレイアウト）。複数日は継続印。イベントブロックにタイトル・時刻・色 |

- **オーバーフロー方針**: L1 は「+N件」→クリックでその日の一覧（L3 遷移 or ポップオーバー）。
- **既存モーフとの両立**: イベント要素は `view-transition-name` を持たせない（ズーム遷移に干渉させない）。

## 8. 作成・編集・削除 UI ★デフォルト提案（要レビュー）

- **作成トリガー**:
  - L1 日セルクリック → その日で新規（終日デフォルト）
  - L2/L3 時刻スロットクリック → その時刻で新規（時間イベント）
  - 各ビューに「＋ 予定」ボタン
- **フォーム形式**: **モーダル**（中央・フォーカストラップ・Escで閉じる）。
- **入力項目**: タイトル / 終日トグル / 日付範囲（開始日〜終了日）/ 時刻（開始・終了、終日OFF時）/ 色8択 / 優先度 / URL / 備考。
- **編集/削除**: イベントクリック → 詳細ポップオーバー（タイトル・時刻・URL・備考）→「編集」「削除」。削除は確認。
- **バリデーション**: タイトル必須、時刻整合（§2 不変条件）、URL 形式（§10）。エラーはフィールド直下に表示。
- **a11y**: モーダルのフォーカス管理、`aria-*`、キーボード操作（Tab/Enter/Esc）。

## 9. セキュリティ

- **URL**: ユーザー入力の URL をリンク描画する際、`http:`/`https:` スキームのみ許可し `javascript:`・`data:` 等を拒否（XSS 対策）。`rel="noopener noreferrer"` を付与。
- **入力**: title/note はテキストとして描画（React の既定エスケープ）。危険な dangerouslySetInnerHTML は使わない。
- localStorage に機微情報は入れない前提（個人予定のみ）。

## 10. テスト

| 種別 | 対象 |
|------|------|
| 単体（Vitest） | `eventsForDay` / `clipEventToDay` / `layoutDayColumns`（重なり境界）/ `sortForDay` / バリデーション。`LocalStorageEventRepository`（保存・読込・更新・削除の往復） |
| 実機（Playwright） | 作成→各ビュー表示→編集→削除の一連。複数日（終日/時間）が各日に出るか。重なり横並びの見た目 |
| 回帰 | 既存 116 テスト緑・ズーム遷移不変・First Load 予算内 |

## 11. 受け入れ基準

- [ ] 予定を作成/編集/削除でき、再訪（リロード）後も保持される（localStorage）
- [ ] 終日・時間・複数日（終日/時間）が L0〜L3 で正しく表示される
- [ ] 重なる時間イベントが Google 風に横並びする
- [ ] 8色・優先度・URL・備考が保存/表示される。URL は安全に描画される
- [ ] `EventRepository` インターフェース越しに永続化され、UI/ドメインは実装非依存
- [ ] 既存機能（ズーム遷移・設定）に回帰なし。全単体テスト緑・型緑・ビルド成功・First Load < 150KB
- [ ] reduced-motion/非対応で破綻しない

## 12. スコープ外（将来・v0.2.x 以降）

繰り返し / 通知 / 場所 / 添付（Supabase Storage 前提）/ 他ユーザー共有 / アカウント・認証 / 複数端末同期（Supabase）/ 連続バー表示（週跨ぎの一本帯）/ JSONエクスポート・インポート（消失対策・早期の小タスク候補）。
