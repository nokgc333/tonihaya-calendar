# 設計: 予定の保存失敗をユーザーに可視化（L-2）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-12 |
| ステータス | 承認済（実装へ） |
| 対象 | tonihaya-calendar / 予定 CRUD の保存失敗フィードバック |
| 関連 | `useEvents`（楽観更新）、`useEventEditor`（モーダル開閉）、`EventModal`（エラー表示欄）、`LocalStorageEventRepository`（write は失敗時 rethrow） |
| 決定経緯 | AskUserQuestion（入力は残したい／Supabase後に失敗が増える／将来は汎用通知も欲しい）→ 案A採用。汎用トーストは Supabase 時に別途 |

## 1. 目的とスコープ

**目的**: localStorage 保存失敗（容量超過・プライベートモード等）時、現状は `useEvents` が例外を握って楽観更新をスキップ→**ユーザーには何も出ず予定が黙って消える**。これを「モーダルを閉じず・入力を残したまま・エラーを表示」して可視化し、その場で再試行できるようにする。

**スコープ（入れる）**
- `useEvents` の CRUD（add/update/remove）を **成否 `Promise<boolean>`** で返すよう変更（成功=true / 保存失敗=false）。
- `useEventEditor` は **成功時のみモーダルを閉じる**。失敗時は開いたまま。
- `EventModal` は保存/削除が false のとき、**既存のエラー表示欄**に日本語メッセージを出す（入力は保持）。

**スコープ外（将来）**
- 汎用トースト/通知システム（「保存しました」「削除しました」「同期状況」等・モーダル外イベント）。実需要は Supabase 同期時に発生 → **Supabase と同時に実装**。
- 本設計の「モーダル内で保存失敗を出す」パターンは、**Supabase のネット保存失敗（オフライン/認証/競合）にそのまま拡張できる土台**とする。

## 2. データフロー（変更点）

```
現状: repo.write() 失敗→rethrow → useEvents CRUD が catch{return}（握る）→ useEventEditor が無条件 close() → 黙って消える
変更: repo.write() 失敗→rethrow → useEvents CRUD が catch{return false} → useEventEditor は ok のときだけ close()
      → 失敗時モーダル残存 → EventModal が onSubmit/onDelete の false を受けてエラー欄に表示（入力保持）
```

## 3. 変更詳細

### 3.1 `src/hooks/useEvents.tsx`
- `EventContextValue` の CRUD 戻り値を `Promise<void>` → `Promise<boolean>` に変更。
- 各実装: `try { await repo().X() } catch { return false }` → 楽観更新 → `return true`。

### 3.2 `src/hooks/useEventEditor.tsx`
- `onSubmit`: `const ok = editing ? await updateEvent({...editing,...draft}) : await addEvent(draft); if (ok) close(); return ok;`
- `onDelete`: `const ok = await removeEvent(editing.id); if (ok) close(); return ok;`

### 3.3 `src/components/EventModal.tsx`
- props の型を拡張: `onSubmit: (draft) => void | Promise<boolean>` / `onDelete?: () => void | Promise<boolean>`。
- `handleSubmit` を async 化: バリデーション通過後 `const ok = await onSubmit(draft); if (ok === false) setErrors([SAVE_ERROR])`。
  - `ok === false` のみ失敗扱い（`undefined`/`true` は成功＝既存の void 互換）。
- 削除ハンドラ: `const ok = await onDelete(); if (ok === false) setErrors([DELETE_ERROR])`。
- メッセージ定数:
  - `SAVE_ERROR = "保存できませんでした。ブラウザの空き容量やプライベートモードをご確認ください。"`
  - `DELETE_ERROR = "削除できませんでした。ブラウザの空き容量やプライベートモードをご確認ください。"`
- 表示は**既存の `errors` 赤リスト欄を再利用**（新UIなし）。再送信時は `setErrors([])` でクリアしてから await。

## 4. テスト

- `src/hooks/useEvents.test.tsx`:
  - Harness に「最後の操作の戻り値」を testid で露出。
  - add 成功 → `true` かつ count 増加。
  - `ThrowingAddRepo` で add → `false` かつ count 不変（既存 error-path を拡張）。
- `src/components/EventModal.test.tsx`:
  - `onSubmit` が `Promise.resolve(false)` → 保存後にメッセージ「保存できませんでした…」が表示される。
  - 既存の成功系テストは `ok === false` 判定のため無改修で通る（`vi.fn()`=undefined は成功扱い）。
- `useEventEditor` の「失敗時モーダル残存」は上記2ユニット＋型チェックで担保（統合テストは省略）。

## 5. 検証
- 3点セット（vitest / tsc / next build）。既存 EventModal 成功系・useEvents テストが緑のまま。

## 6. ブランチ・コミット運用
- `develop` から `feat/save-failure-feedback`。`--no-ff` で develop。commit は `type: 日本語`・`Co-Authored-By` なし。
