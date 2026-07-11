# 引継書 — tonihaya-calendar（守り・品質バッチ＋セキュリティ監査 完了後 / v0.2.1）

作成: 2026-07-12 / 本番: **v0.2.1 稼働中**（https://tonihaya-calendar.vercel.app）

> 次セッションで文脈を高再現で復元するための引継書。プロジェクトメモリ
> `~/.claude/projects/-/memory/tonihaya-calendar.md` が**自動ロードされる前提**（全成果を記録済み）。
> ここには「直近の到達点・要注意点・次アクション・再開手順」を集約する。
> 詳細な技術ログは同日のセッションレポート3本（`~/.claude/reports/... いや` iCloud
> `05_session-report/202607111416_ci-setup*` / `202607111556_ui-tests*` /
> `202607120258_security-audit-csp-and-defense-hardening*`）にある。

---

## 1. いまの状態（結論）

- **develop = main = 完全同期・全て本番反映済み・ツリークリーン**（`main..develop` 空）。
- **v0.2.1 リリース済**（2026-07-12）: このセッションの成果（CI/UIテスト/セキュリティ監査+コマンド化/a11y/maxLength/セキュリティヘッダ+CSP/L-2）を**堅牢化・品質リリース**として version 0.2.1＋タグ `v0.2.1`（main HEAD）で確定。**version↔タグ整合済み・宿題なし**。
- タグ現況: 最新 `v0.2.1`（`v0.1.x`〜`v0.2.1`）。
- CI（GitHub Actions＋LHCIサイズ予算）が develop/main で**緑稼働**。総**171テスト**。
- この引継書ファイル自体は untracked（前回同様。必要なら `chore/` で別途コミット）。

### ブランチ現況
- `main` = `develop`（HEAD `ffa4854`）。差分なし。
- ローカル残置: `feat/events-mvp` / `feat/jump-zoom-transition` / `refactor/consistency-cleanup`（掃除は任意）。

---

## 2. このセッションで入ったもの（成果）

すべて develop→main へ `--no-ff` 統合・本番反映・実機検証済み。

### 基盤・品質
- **CI導入**: `.github/workflows/ci.yml`＝2ジョブ（`verify`=type-check/test/build＋artifact / `lighthouse`=LHCIサイズ予算 `script:size≤138240B`・`total:size≤153600B`＝error、Perfスコア=warn）。トリガ=PR/push(develop,main)＋concurrency。**依存インストールは `npm install`**（macOS lockのLinux optional欠落対策）。Actions は Node24化（checkout@v7/setup-node@v6/upload@v7/download@v8）。
- **UIテスト拡充**: happy-dom＋@testing-library。`EventChip`/`EventModal`/`MonthCard`/`useEvents`/`SettingsMenu`。環境は各`.test.tsx`先頭の `// @vitest-environment happy-dom`、`vitest.config.ts`に`esbuild:{jsx:"automatic"}`、jest-dom型は`src/vitest.d.ts`。
- **全体セキュリティ監査**: 結論=**自作コードに重大脆弱性なし**（クライアント専用静的・攻撃面はXSSと依存のみで両方良好）。`docs/security-audit-2026-07-11.md`＋構造/責務マップ `docs/architecture.md`（手動カスタマイズ表つき）。中央蓄積 `~/.claude/reports/security/tonihaya-calendar/`＋`INDEX.md`。
- **/security-report コマンド新設**（`~/.claude/commands/security-report.md`・既定Opus）。CLAUDE.md/SITEMAP.md/ARCHITECTURE.md 登録済み。

### 守り・品質バッチ（監査由来）
- **I-1 入力maxLength**: `validateEvent`＋`EventModal`（title200/note2000/url2048、定数`TITLE/NOTE/URL_MAX_LENGTH` export）。二重の守り（入り口maxLength＋保存時validate）。
- **残Minor a11y**: `SettingsMenu` に `aria-haspopup="dialog"`＋開でポップオーバー内へフォーカス移動＋Escで歯車へ復帰。
- **M-1 セキュリティヘッダ**: `vercel.json` に X-Content-Type-Options / Referrer-Policy / Permissions-Policy / HSTS（preloadは除外＝vercel.appサブドメイン）。
- **M-1 CSP（enforce・本番検証済）**: `script-src 'self' 'unsafe-inline'`（**Next static exportのinline scriptが厳格script-srcと両立不可**のため許容）＋他は厳格（frame-ancestors/form-action/base-uri/object-src/img・connect・style制限）。`va.vercel-scripts.com`は不要（Speed Insights同一オリジン）と実測し削除。
- **L-2 保存失敗の可視化**: `useEvents`のCRUDを`Promise<boolean>`化→`useEventEditor`は成功時のみclose→`EventModal`がfalseで既存エラー欄に「保存できませんでした…」表示（入力保持・再試行可）。**このパターンはSupabaseのネット保存失敗に拡張できる土台**。

### 決着済み（見送り確定・覆す条件つき）
- 遷移delay（速度優先）／ ESLint導入（tsc+Prettier+testで実害カバー・hooks手調整と衝突）／ C-2単発（差分に併走）／ ズーム穴点検（解消済みで削除）。

### 棚卸し（初心＝要件定義書との突合で発覚）
- **★MVP-Must なのに未実装/未露出**（`docs/要件定義書.md`§5.1）: **FR-10 時間計算(電卓)UI**（domain`timecalc`完成・UI未露出＝最速回収）/ **FR-04・11 六曜** / **FR-11 設定トグルの残り**（六曜ON/OFF・和風月名ON/OFF・テーマ/配色切替。現状は週開始のみ）/ **FR-09 祝日一覧・ジャンプUI**（domainあり・画面未露出）。
- **要ユーザー確認**（意図的ドロップか）: FR-01起動スプラッシュ / FR-07の10年移動・〜645年遡及（現状1950–2150）。

---

## 3. 次アクション候補（推奨順）

### 🎯 初心の未達（要件のMVP-Must）
- **FR-10 時間計算(電卓)UI** ★最有力（domain完成済＝UIを出すだけ・競合に無い差別化）
- 六曜（FR-04/11）/ 表示設定トグルの残り（FR-11）/ 祝日一覧・ジャンプUI（FR-09）

### 🅰 機能拡張
- **A-1 複数日の連続バー表示**（見栄えの目玉・週行単位で純関数化しTDD可・L1週行のVT複製オーバーレイとの共存に注意）
- A-3 予定検索 / A-2 繰り返し予定 / A-4 Supabase同期

### 🅿 iOS体制
- PWA化（Service Worker/manifest/アイコン/install導線）

### 🅲 守り・残り
- 汎用トースト/通知システム（保存完了・削除・**同期状況**）… **Supabase同期と同時に実装**（今はYAGNI）
- CSPの上半分（インラインXSS防御）… ハッシュ注入ビルド等・将来

### 🔧 運用
- v0.2.1 タグは処理済み（宿題なし）。次のアプリ変更をリリースする区切りで v0.2.2 / v0.3.0 を判断。

---

## 4. 再開手順（そのまま実行可）

```bash
cd /Users/naokikaneko/tonihaya-calendar
git switch develop            # 新作業は develop から feat/* を切る
git status --short            # クリーン確認（?? docs/handoff/ はこの引継書）
npx vitest run && npx tsc --noEmit && npx next build   # 3点セット（171緑を確認）
```

- **ブランチ運用**: develop から `feat/|fix/|chore/|test/<名前>` を細かく → `--no-ff` で develop → 区切りで develop→main(`--no-ff`)→**アプリ変更あれば semverタグ**。commit は `type:日本語`・`Co-Authored-By` なし。
- **検証**: `npm run dev` はフックでブロック。3点セット＋（UIは happy-dom テスト）。本番実機は Playwright(MCP)。
- **本番反映確認**: `vercel inspect https://tonihaya-calendar.vercel.app`（エイリアス→最新Ready）＋ `curl -sI` でヘッダ。エッジ `x-vercel-cache: HIT` の stale は数分で解消。
- 実装を伴う機能は **superpowers brainstorming → （必要なら）writing-plans → TDD** で進める（このプロジェクトの確立フロー）。

---

## 5. 落とし穴メモ（再発防止・このセッションで踏んだもの）

- **CSP × Next static export**: inline script（RSC/ハイドレーション）が `script-src 'self'` と両立不可。static export は nonce 不可・hashは毎ビルド変化。現状は `'unsafe-inline'` 許容で運用中。**⚠️ Supabase等を足す時は `vercel.json` の `connect-src` にURL追加必須**（例 `https://*.supabase.co`）。忘れると「ローカルは動くが本番だけ通信がCSPでブロック」（ローカル`next build`はvercel.json非適用で気付けない）。
- **Vercel検証**: プレビュー/直デプロイURLは Deployment Protection(SSO 302) で未認証到達不可（オーナーはブラウザで可）。CSP等の観測はローカルにヘッダ注入サーバを立てて Playwright。反映は `vercel inspect` でエイリアス→最新Ready確認（`x-vercel-cache: HIT` の stale は数分で解消・`?cb=`では外せない）。
- **CI依存インストール**: macOS生成lockはLinux固有optional（`@emnapi/*`・Tailwind oxide-wasm等）を欠き `npm ci` が落ちる → CIは `npm install`。
- **maxLength**: 入り口で黙って切る（エラーは出ない）。保存時validateは保険（UI迂回時のみ発火）。＝「保存でエラーが出ないのが正常」。
- View Transitions は名前付き要素を root から持ち上げる → day-zoom は複製オーバーレイで対処済（実装コメント参照。旧「未点検」項目は解消済みで削除）。
