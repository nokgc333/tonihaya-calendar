# 引継書：ジャンプ・ズーム遷移（作業中・要バグ調査）

作成：2026-07-08
目的：`feat/jump-zoom-transition` の未完了作業を次セッションで継続する。**ユーザーが「バグっている」と報告**しており、実機の視覚挙動の調査が最優先。

---

## 0. 最初にやること
1. この引継書、プロジェクト `CLAUDE.md`・`MEMORY.md`（自動ロード）を読む。
2. 設計：`docs/superpowers/specs/2026-07-07-jump-zoom-transition-design.md`
3. 計画：`docs/superpowers/plans/2026-07-07-jump-zoom-transition.md`
4. SDD ledger：`.superpowers/sdd/progress.md`（末尾「ジャンプ・ズーム遷移」節）
5. **ブランチ `feat/jump-zoom-transition` を checkout**（未マージ。develop=`251d825` に設計/計画のみ、main=v0.1.6=`802eaea`）。

## 1. 機能の目的
「年/月/週/日」ボタン（`LevelSwitcher`）でのジャンプ時に、押下の「その日（が属する対象）」へズームイン/アウトさせる。従来ジャンプはクロスフェードだった。
- **隣接ジャンプ（1レベル差）**＝既存ドリルモーフ流用（`month-N`/`day-zoom`/`hour-zoom`）。`jumpTo` が掃除の代わりに該当 pivot を張る。
- **多段ジャンプ（2レベル以上）**＝日アンカー `jump-zoom`。全ビューが「その日」の要素に `viewTransitionName:"jump-zoom"` を張り、`month-N` を抑制。

## 2. 実装済み（feat/jump-zoom-transition の3コミット）
- `65f1a16` feat: 隣接ジャンプで既存モーフ流用（`jumpTo` を距離分岐。`LEVEL_ORDER={overview:0,month:1,week:2,day:3}`）— **task-review clean**
- `c8951f1` feat: 多段 jump-zoom（`jumpPivot` 状態＋MonthCard/OverviewBody/MonthDetail/WeekView/DayView に jump-zoom、month-N抑制、L0 MonthCard に `year={year}` 追加）— **task-review PASS**
- `708d048` fix: popstate(戻る)で jumpPivot 掃除（`justJumpedRef` 方式＝ジャンプ直後1レンダーだけ保持し次の任意遷移で掃除。`[zoom.level,year,month,day]` 監視 useEffect）

## 3. E2E（Playwright, out/@4599）でのDOM検証結果＝いずれも合格
- 隣接 L2→日：L3外枠=`hour-zoom`（既存流用）・共有要素1つ・jump-zoom無し
- 多段 L0→日：L3外枠=`jump-zoom`（1つ）・hour-zoom無し・today補完
- 多段 L3→年：L0で `jump-zoom` が「その日セル(15)」ちょうど1つ・`month-N`抑制(0)。12枚カードのパディング重複無し（`cell.inMonth` 判定が効く）
- forward自己修復：ジャンプ後にドリル→ jumpPivot掃除・month-N復活
- popstate：修正前は戻るで jumpPivot残存・month-N抑制のまま（バグ再現）→ 修正後(708d048)は戻るで jumpZoom=0・monthN=12（掃除OK）

## 4. ★未解決：ユーザーが「バグっている」と報告
- **DOM検証（共有要素の付与）は全て正しいのに、ユーザーの実機ブラウザで視覚挙動がおかしい**とのこと。詳細な症状は未ヒアリング（次セッション冒頭で必ず確認）。
- **View Transitions のモーフ中間フレームは Playwright で撮れない**ため、DOM検証だけでは「見た目のズーム感」を保証できない（設計書にも明記）。実機での視覚確認が必須。
- 調査の切り口候補：
  - 多段ジャンプの「小セル↔大ビュー」モーフが破綻/チラつく（root cross-fade と jump-zoom の同時進行、アニメ時間 220ms、`::view-transition-old/new(root)` の効き）
  - 隣接ジャンプで意図と違う要素がモーフ（例 L0→月 が month-N で月カードへ、想定通りか）
  - L0 に `year={year}` を追加した副作用（`resolveCellMonth` 経路）
  - popstate 修正の副作用（justJumpedRef の effect が正当な jumpPivot を早期クリアしていないか＝ただしE2Eでは多段ジャンプ自体は成立）
  - reduced-motion 設定・ブラウザの View Transitions 対応状況（macOS Safari バージョン等）
- **まず「どのジャンプで・どう」おかしいかを実機で特定**（`npx next build` → `python3 -m http.server 4599 --directory out` で配信し、ユーザーに URL を渡して再現手順を聞く）。

## 5. 次セッションの手順
1. ユーザーにバグの具体症状（どのレベル間ジャンプで・どう見えるか）をヒアリング。
2. 配信して実機再現 → systematic-debugging で原因特定。
3. 修正 → E2E再検証（Task3 の残り：Step4回帰・Step5ユーザー視覚確認・Step6-7）。
4. 最終 whole-branch レビュー（opus）→ finishing-a-development-branch。
5. develop→main で **v0.1.7** リリース（version bump 込み）→ 本番反映確認。

## 6. 運用・制約（厳守。詳細はメモリ [[tonihaya-calendar]]）
- コミット `type:日本語`・`Co-Authored-By`なし。ブランチ運用：`feat/*` を develop から細かく切り `--no-ff`→develop→main(`--no-ff`)→semverタグ。**リリースは通常push（fast-forward）なら Vercel 自動デプロイ、force-push（巻き戻し）は自動デプロイされないので `vercel --prod` を使う**。
- `npm run dev` はフックでブロック→検証は `npx next build`＋`python3 -m http.server 4599 --directory out`＋Playwright。3点セット=`npx vitest run && npx tsc --noEmit && npx next build`。116テスト緑・First Load 112KB。
- View Transitions は `getComputedStyle(el).viewTransitionName` の DOM 検証（中間フレーム不可）。色は必ずCSSトークン経由。
- 本番 https://tonihaya-calendar.vercel.app は現状 **v0.1.6**（jump-zoom は未反映）。
