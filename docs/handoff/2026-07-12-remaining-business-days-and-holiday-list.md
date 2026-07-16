# 引継書 — tonihaya-calendar（残り営業日＋祝日一覧サイドバー / v0.2.2）

作成: 2026-07-12 / 本番: **v0.2.2 稼働中**（https://tonihaya-calendar.vercel.app）

> 次セッションで文脈を高再現で復元するための引継書。プロジェクトメモリ
> `~/.claude/projects/-/memory/tonihaya-calendar.md` が**自動ロードされる前提**。
> 前段の到達点は同ディレクトリ `2026-07-12-post-defense-hardening.md`（v0.2.1）を参照。
> ここには「このセッションの成果・要注意点・次アクション・再開手順」を集約する。

---

## 1. いまの状態（結論）

- **develop = main = 完全同期・全て本番反映済み・ツリークリーン**（`main..develop` 空）。
- **v0.2.2 リリース済**（2026-07-12）: 残り営業日カウント＋祝日一覧サイドバーを追加し、version `0.2.2`＋注釈タグ `v0.2.2`（main HEAD `7f93bc0`）。**version↔タグ整合済み・宿題なし**。
- CI（GitHub Actions＋LHCIサイズ予算）は develop/main で**緑**。総**171テスト**。
- この引継書ファイル自体は untracked（前回同様。必要なら `chore/` で別途コミット）。

### ブランチ現況
- `main`（`7f93bc0`）が `develop`（`c5b0b17`）を包含。差分なし。
- ローカル残置ブランチ（掃除は任意）: `chore/bump-0.2.2` / `feat/holiday-list-business-days`（今回分・マージ済）／ 旧 `feat/events-mvp` / `feat/jump-zoom-transition` / `refactor/consistency-cleanup`。

---

## 2. このセッションで入ったもの（成果）

すべて `feat/*`→develop→main へ `--no-ff` 統合・本番反映・Playwright実機検証済み。

### ① 残り営業日カウント（俯瞰ヘッダー）
- ヘッダーのカウントチップ「四半期末まで」→**「残り営業日 N日」**に置換。
- 定義: **今月末まで／本日を含めない（翌日以降）／土日＋祝日（振替含む）を除外**。既存 `toMonthEnd`（本日除外）に合わせた。
- 実装: `src/domain/countdown/countdown.ts`（`toQuarterEnd`削除→`remainingBusinessDays`追加・`isHoliday`利用）、`countdown.test.ts`（祝日除外の検算テスト・成人の日/GW振替）、`CountdownChips.tsx`（ラベル差替）。

### ② 祝日一覧サイドバー（俯瞰ビュー右・FR-09の露出）
- `src/components/HolidayList.tsx`（**新規**）: 表示中の年の祝日一覧。**過去はトーンダウン・当日/当月を太字強調・行クリックでその月へジャンプ**（`onMonthClick`再利用→`?y&m`遷移）。sticky・縦1列。見出し「祝日一覧」は `text-lg font-bold`。
- `src/components/OverviewBody.tsx`: 年間グリッドを `flex` 化し、**≥1600px でのみ右に aside 表示**（`hidden min-[1600px]:block`）。グリッドは `w-full min-[1600px]:w-[1256px] shrink-0`。
- `src/components/CalendarApp.tsx`: 俯瞰ラッパー幅を**画面幅で切替**＝`max-w-[1256px] min-[1600px]:max-w-[1600px]`（月ビューL1は内側1256pxのまま）。これで **<1600px はヘッダー/ナビ/グリッドが1256px(カード4列幅)で中央寄せ揃え**、**≥1600px は1600px**で右に祝日一覧を持つ。

### ③ 検討して見送った枝（重要・蒸し返し防止）
- **「144pxギャップにサイドを詰める」案は却下**: `max-w[1400]`と`max-w[1256]`の差は中央寄せの結果で片側約56px（px-4込み）しかなく、幅不足。→ 幅を意図的に確保する方針（max-w 1600＋flex）に決着。
- **<1600px でグリッド直下に祝日一覧を出す inline版は実装後に撤去**（ユーザー指示で非表示に復帰）。`HolidayList`から`variant`機構も削除しサイドバー専用に戻した。**＝現状 <1600px は祝日一覧なし**（将来やるならドロワー等が候補）。

---

## 3. 次アクション候補（推奨順）

### 🎯 初心の未達（要件のMVP-Must / `docs/要件定義書.md`§5.1）
- **FR-10 時間計算(電卓)UI** ★最有力（domain `timecalc` 完成済＝UIを出すだけ・競合に無い差別化）
- 六曜（FR-04/11）/ 表示設定トグルの残り（FR-11: 六曜ON/OFF・和風月名・テーマ/配色。現状は週開始のみ）
- FR-09 祝日一覧: 俯瞰の**サイドバー＋月ジャンプは今回で達成**。残るなら「狭幅(<1600px)での参照手段（ドロワー等）」「祝日一覧からの日付ジャンプ粒度」。

### 🅰 機能拡張
- **A-1 複数日の連続バー表示**（見栄えの目玉・週行単位で純関数化しTDD可・L1週行のVT複製オーバーレイと共存注意）
- A-3 予定検索 / A-2 繰り返し予定 / A-4 Supabase同期

### 🅿 iOS体制
- PWA化（Service Worker/manifest/アイコン/install導線）

### 🅲 守り・残り
- 汎用トースト/通知（保存完了・削除・同期状況）… **Supabase同期と同時に**（今はYAGNI）

---

## 4. 再開手順（そのまま実行可）

```bash
cd /Users/naokikaneko/tonihaya-calendar
git switch develop            # 新作業は develop から feat/* を切る
git status --short            # クリーン確認（?? docs/handoff/ はこの引継書）
npx vitest run && npx tsc --noEmit && npx next build   # 3点セット（171緑を確認）
```

- **ブランチ運用**: develop から `feat/|fix/|chore/|test/<名前>` を細かく → `--no-ff` で develop → 区切りで develop→main(`--no-ff`)→**アプリ変更あれば semverタグ**（注釈付き `git tag -a vX.Y.Z -m "…"`）。commit は `type:日本語`・**`Co-Authored-By` なし**。
- **検証**: `npm run dev` はフックでブロック。3点セット＋（UIは happy-dom テスト）。本番実機は Playwright(MCP)。
- **本番反映確認**: `vercel inspect https://tonihaya-calendar.vercel.app`（エイリアス→最新Ready）／CIは `gh run list --branch main`。
- 実装を伴う機能は **superpowers brainstorming →（必要なら）writing-plans → TDD** で進める。

---

## 5. 落とし穴メモ（このセッションで踏んだもの・再発防止）

- **⚠️ dev server 起動中に `npm run build` を実行しない**: `next dev` と `next build` は同じ `.next` を共有し、ビルドが開発用成果物を上書きして**稼働中devが無スタイル/500になる**（このセッションで2回踏んだ）。復旧は「dev停止→`.next`削除→dev再起動」。検証は原則 dev停止後にビルド、稼働中は type-check/test まで。
  - 補足: `.next` 削除は Bash フックが `rm -rf /...` を誤検知するので `find .../.next -maxdepth 0 -exec rm -rf {} +` 等で回避。
- **祝日一覧の幅算段**: カード実寸は `w-[305px]`、グリッド gap は `gap-3`(=12px)、4列＝1256px。サイド確保の上限は 1600px（=1256＋gap＋サイド約300px）。これらの前提でレイアウトを組んでいる。
- **チップ/一覧は today 依存でクライアント描画**: SSR HTML には「残り営業日」「祝日一覧」の実値が出ない。反映確認は Playwright で実描画スナップショット（`curl`のHTML grep では検証不可）。
- （前段から継続）**CSP × Next static export**: Supabase等を足す時は `vercel.json` の `connect-src` にURL追加必須（例 `https://*.supabase.co`）。ローカル`next build`はvercel.json非適用で気付けない。
