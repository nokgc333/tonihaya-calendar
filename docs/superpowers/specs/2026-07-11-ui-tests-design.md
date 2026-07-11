# 設計: UIテスト拡充（components / hooks の要所テスト・C-3）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-11 |
| ステータス | 草案（レビュー待ち） |
| 対象 | tonihaya-calendar / UI 層（`src/components`・`src/hooks`）のテスト導入 |
| 関連 | 既存 vitest（`environment: node`・domain のみ）、`@/domain/event`（`validateEvent`/`isSafeUrl`）、`EventProvider`（`repository?` 注入可）、CI `verify` ジョブ |
| 決定経緯 | 案A（薄く鋭く＝高価値ユニットに絞る）× happy-dom＋`environmentMatchGlobs` で部分DOM化 × 対象4ユニット |

> 本書はブレインストーミング（案A / happy-dom部分DOM化 / 4ユニット）で確定した方針を仕様化したもの。

## 1. 目的とスコープ

**目的**: domain 純関数は厚くテスト済みだが UI 層（components/hooks）はテストゼロ。回帰したら痛い「分岐ロジック・ユーザー操作・永続化」が絡む**少数の要所**にコンポーネント/フックテストを導入し、以降の機能追加（複数日バー等）での UI 回帰を検知できるようにする。CI に自動で載せる。

**スコープ（入れる）**
- UI テスト基盤の導入: happy-dom ＋ `@testing-library/react` ＋ `@testing-library/user-event` ＋ `@testing-library/jest-dom`。
- vitest を「domain は `node`（高速維持）、`src/components`・`src/hooks` のみ DOM 環境」に配線。`.test.tsx` を include。
- 対象4ユニットのテスト:
  1. `src/hooks/useEvents.tsx`（楽観更新・保存失敗時の不変性）
  2. `src/components/EventModal.tsx`（バリデーション表示・onSubmit/onDelete）
  3. `src/components/MonthCard.tsx`（L1 チップ最大3＋「+N件」／L0 ドット／選択）
  4. `src/components/EventChip.tsx`（時刻整形・click 伝播）

**スコープ外（将来・段階的に）**
- 大物ビュー `DayView` / `WeekView` / `MonthDetail`（スクロール・View Transitions 依存でフレーキー寄り）。
- `useZoomState`（history/popstate 依存）。
- `SettingsMenu` / `LevelSwitcher` / `AddEventButton` / `useEventEditor`（優先度低・小。必要になれば追加）。
- カバレッジ閾値の UI 層拡大（案C）。網羅目的の薄いテスト量産を避けるため、**coverage 対象は `src/domain/**` のまま据え置く**。
- E2E（Playwright）は既存の手元 MCP 運用のまま（CI 化は別途）。

## 2. テスト基盤

### 2.1 依存追加（devDependencies）
- `happy-dom` — 軽量 DOM 環境。
- `@testing-library/react` — コンポーネント描画・クエリ。
- `@testing-library/user-event` — ユーザー操作シミュレーション。
- `@testing-library/jest-dom` — `toBeInTheDocument` 等のマッチャ。

### 2.2 `vitest.config.ts` 変更
```ts
test: {
  globals: true,
  environment: "node",                       // 既定は node（domain 用・据え置き）
  environmentMatchGlobs: [
    ["src/components/**", "happy-dom"],
    ["src/hooks/**", "happy-dom"],
  ],
  include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"], // tsx 追加
  setupFiles: ["./vitest.setup.ts"],
  coverage: {
    provider: "v8",
    include: ["src/domain/**"],               // 据え置き（UI 層は含めない）
    thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
  },
},
```
- `resolve.alias`（`@` → `./src`）は既存のまま。

### 2.3 `vitest.setup.ts`（新規）
- `import "@testing-library/jest-dom/vitest";` でマッチャ登録。
- `document.startViewTransition` の無害モック（未実装環境向け・即時実行フォールバック）:
  ```ts
  if (!(document as any).startViewTransition) {
    (document as any).startViewTransition = (cb: () => void) => {
      cb();
      return { finished: Promise.resolve(), ready: Promise.resolve(), updateCallbackDone: Promise.resolve() };
    };
  }
  ```
  ※ 対象4ユニットは基本 VT 非依存だが、間接的に触れても落ちないための保険。
- `crypto.randomUUID` は happy-dom が提供（`useEvents` の add で使用）。存在しない場合のみ簡易フォールバックを置く。

## 3. 対象ユニットのテスト仕様

### 3.1 `src/hooks/useEvents.test.tsx`
- **フェイクリポジトリ**: `EventRepository`（`list/add/update/remove`）を満たす in-memory 実装をテスト内に定義。`EventProvider repository={fake}` で注入（DOM の localStorage に依存しない＝決定論的）。
- テスト用の小さな consumer コンポーネントで `useEvents()` を読み、ボタン等で各操作を発火。
- ケース:
  - 初期 `list()` の結果が `events` に反映され `loading` が false になる。
  - `addEvent(draft)` → `events` に1件増え、fake に add が渡る（`id`/`createdAt`/`updatedAt` 付与）。
  - `updateEvent(event)` → 該当が置換され `updatedAt` 更新。
  - `removeEvent(id)` → 該当が除外。
  - **error path**: `add` が reject する fake → `events` は不変（楽観更新されない）。

### 3.2 `src/components/EventModal.test.tsx`
- props: `initial`/`defaultDate`/`onSubmit(draft)`/`onDelete?`/`onClose`。
- ケース:
  - 空タイトルで送信 → 「タイトルを入力してください」表示・`onSubmit` 未呼び出し。
  - `allDay` オフで不正 URL（`javascript:alert(1)`）→ 「URLは http/https のみ使用できます」。
  - 終了日 < 開始日 → 「終了日は開始日以降にしてください」。
  - 同日・終了時刻 ≤ 開始時刻（時間イベント）→ 「終了時刻は開始時刻より後にしてください」。
  - 妥当入力で送信 → `onSubmit` が `EventDraft`（title 等を含む）で1回呼ばれる。
  - `initial` 指定時の削除操作 → `onDelete` が呼ばれる。
- エラー文言は `@/domain/event` の `validateEvent` 由来（実装と一致）。

### 3.3 `src/components/MonthCard.test.tsx`
- L1（`spacious=true`, `size="lg"`）: 当月の同一日に4件 → チップ3件＋「+1件」。チップ click → `onEventSelect(id)`。
- L0（`spacious=false`, `size="sm"`）: 当月日にイベントあり → ドット（最大3・`data` ではなく描画有無で確認）。
- 描画に必要な最小 props（`month`/`weekStart`/`year`/`events`/`onEventSelect` 等）はテスト内でビルド。`month: MonthView` は既存の `buildMonthView(year, month, today, settings)`（`@/domain/view`）で生成する。

### 3.4 `src/components/EventChip.test.tsx`
- 時間イベント（`allDay=false`, `start.time={9,5}`）→ 表示に `09:05` とタイトルを含む（ゼロ埋め）。
- 終日イベント → タイトルのみ（時刻なし）。
- click → `onSelect(id)` が呼ばれ、かつ親要素の click ハンドラが発火しない（`stopPropagation` の確認）。

## 4. 共通パターン（規約）

- 描画は `@testing-library/react` の `render`＋`screen`、操作は `user-event`（`userEvent.setup()`）。
- クエリは role/text ベース（`getByRole`/`getByText`/`findByText`）中心でアクセシブルに。`data-event-id` 等の実装詳細依存は最小限（`stopPropagation` 検証など不可避な箇所のみ）。
- テスト名は日本語で「何を・どうしたとき・どうなるか」、AAA（Arrange/Act/Assert）で記述（既存 domain テストに合わせる）。
- 非同期反映（`useEvents` の Promise、モーダルの送信）は `findBy*` / `await` / `waitFor` で待つ。

## 5. ファイル構成

| ファイル | 変更 |
|---|---|
| `package.json` | devDep 4点追加 |
| `vitest.config.ts` | `include` に tsx／`environmentMatchGlobs`／`setupFiles` |
| `vitest.setup.ts` | 新規（jest-dom 登録・VT モック） |
| `src/hooks/useEvents.test.tsx` | 新規 |
| `src/components/EventModal.test.tsx` | 新規 |
| `src/components/MonthCard.test.tsx` | 新規 |
| `src/components/EventChip.test.tsx` | 新規 |

## 6. エラー処理・失敗時の扱い

- 環境非対応 API（`startViewTransition`）は setup のモックで吸収。対象ユニットは基本 VT 非依存。
- happy-dom で互換性問題が出た特定テストのみ、ファイル先頭 `// @vitest-environment jsdom` で jsdom に逃がす退避策を許容（全体切替はしない）。
- 非決定的要素（`Date.now`/`crypto.randomUUID`）はアサーションで値そのものを固定せず「増えた/付与された/呼ばれた」を検証。必要時のみ `vi.spyOn` でモック。

## 7. 検証

- 3点セット: `npx vitest run`（node＋happy-dom 混在で緑）＋ `npx tsc --noEmit` ＋ `npx next build`。
- domain テストが `node` 環境のまま維持され、速度が有意に劣化していないことを確認（実行時間の目視比較）。
- 新テストは CI `verify` ジョブの `npm run test` でそのまま実行される（ワークフロー変更不要）。

## 8. ブランチ・コミット運用

- `develop` から `test/ui-components`（または `chore/ui-tests`）を切り、ユニット単位の細かめコミット（`test: EventChipのテストを追加` 等）→ `--no-ff` で develop。
- アプリのランタイム変更は無い（テスト・設定のみ）ため main マージ・タグは次の区切りでまとめて可。
- commit 規約: `type: 日本語`・`Co-Authored-By` なし（repo `CLAUDE.md` 準拠）。
