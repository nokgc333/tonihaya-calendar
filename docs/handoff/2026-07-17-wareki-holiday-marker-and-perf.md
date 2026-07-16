# 引継書 — 和暦(v0.2.3)・祝日マーカー(v0.2.4)・perf修正

作成: 2026-07-17 / 本番: **v0.2.4 稼働中**（https://tonihaya-calendar.vercel.app）

> 前段 = `docs/handoff/2026-07-15-ui-refinements-and-view-structure.md`（UI磨き込み＋構造リファクタ・v0.2.2据置）。
> プロジェクトメモリ `~/.claude/projects/-/memory/tonihaya-calendar.md` が自動ロードされる前提。

---

## 1. いまの状態（結論）

- **develop = main = 完全同期**（`main..develop` 0）。本番エイリアスは最新デプロイに反映済み。
- **version = 0.2.4**、注釈タグ **v0.2.4** まで push 済み（v0.2.2/v0.2.3/v0.2.4）。
- 185テスト緑 / tsc clean / build OK。
- 未コミットは `docs/handoff/*.md`（本引継書と過去2件）のみ（untracked・慣習どおり）。
- レベル呼称: **L0=年 / L1=月 / L2=週 / L3=日**。

## 2. このセッションで入れたもの（3リリース）

### v0.2.3 — 和暦(令和)の日付表記
- **新ドメイン `src/domain/era/`**（`toWareki`/`formatWarekiYear`/`formatYearWithEra`・TDD 14テスト）。
  - 元号境界は**「日付」で判定**（改元は年途中。2019/4/30=平成31、5/1=令和元）。初年は「元年」。2019/5以降〜対応上限2150は令和が続く前提。
- 表示（**L0のみ和暦**に確定）:
  - L0（今日）: `2026年(令和8年) 7月16日 木曜日`
  - L1（月）: `2026年 7月`
  - L2（週）: `2026年 7月12日 〜 7月18日`（**年跨ぎ時のみ末尾に翌年**: `… 〜 2027年 1月2日`）
  - L3（日）: `2026年 7月15日 水曜日`（西暦のみ・和暦なし）
  - 曜日は `(水)`→`水曜日` のフル表記（L0/L3）。
- **`formatYearWithEra` は L0(TodayHeader) でのみ使用**（L1/L2/L3 は素の西暦）。

### v0.2.4 — 祝日マーカー＋L0イベント点の再配置
- 課題: 日曜と祝日が同じ赤背景で見分けにくい。
- 対応: **祝日=数字の背後に丸マーカー**（`--holiday-disc`=薄黄緑`#a3e635`45% / `--holiday-text`=濃い緑）で差別化（`globals.css`トークン・`dayPalette.ts`）。日曜は赤トーン維持、祝日は**赤トーンを敷かず丸で示す**。丸は**絶対配置で高さ不変**（今日リング/チップと干渉なし）・直径`calc(1.5em + 1px)`。対象 **L0/L1/L2**（`MonthCard`/`WeekView`）、L3対象外。
- **L0イベント点を再設計**: 番号の**直右に下方向(↓)→右(→)**、`grid-flow-col grid-rows-3`で**2列×3行=最大6個**（予約幅9px）、超過は「＋」、**単列は`justify-end`で右寄せ**、列間`gap-x-[1px]`。丸マーカーの右端をかわす位置（`left:calc(50%+9px)`）。
- 日セルの**直上paddingを+1px**（L0 `pt-[5px]`/L1 `pt-[7px]`、両描画経路）。

### perf修正（挙動不変・タグなし）
- **「もっさり」の主因を実測特定**: `getHoliday()` が呼ぶ度に `computeYearHolidays(year)` をノーキャッシュ再構築。`buildYearView` がセル毎（L0で約500回）に呼び **buildYearView ≈ 4.2ms**。
- **修正**: `src/domain/holiday/holiday.ts` に**年キャッシュ（`Map<number, readonly Holiday[]>`）**追加 → **buildYearView 4234µs→144µs（約29倍）**。`getHolidaysInYear` はキャッシュを壊さないようコピーを返す。
- L0/L1/L2/L3 すべての祝日参照に効く。

## 3. 検討して見送った枝（蒸し返し防止）

- **和暦は全レベルに出さない**（「全和暦だとクドい」→ L0のみ和暦に確定。3回の手直しで着地）。
- **祝日マーカーはオレンジではなく薄黄緑**（オレンジは赤い日曜トーンと重なると視認性低・沈む）。
- **祝日は丸マーカーで示し、赤トーンのセル背景は敷かない**（日曜=赤／祝日=丸で役割分担）。
- **残perf最適化は未着手**（下記）。今回の年キャッシュで大半解消と判断し、体感確認で満足。

## 4. 次アクション候補（推奨順）

### 機能
- 🎯 **FR-10 時間計算(電卓)UI ★最有力**（domain `timecalc` 完成済＝UIを出すだけ・競合にない差別化・MVP-Must回収）
- 🅰 **A-1 複数日の連続バー表示**（見栄えの目玉・週行単位でTDD可・L1週行のVT複製オーバーレイと共存注意）
- 六曜（FR-04/11）／表示設定トグルの残り（要否はユーザー確認から）
- 🅿 PWA化 ／ 🅲 A-4 Supabase同期（要件から・**CSP `connect-src` にURL追加必須**）
- 分岐点: 「完成度→FR-10」「見た目→A-1」。

### perf 残候補（**もっさり再発時のみ**・都度実測で効果確認）
- `buildYearView`/`buildMonthDetail` の `useMemo` 化（`OverviewBody`/`MonthDetail` は毎レンダー再計算）
- `MonthCard` の `React.memo` 化（親再描画で12枚全部が再レンダー）
- `eventsForDay` の日別インデックス化（イベント増加時のセル毎走査削減）
- 背景: components は**非メモ化**、遷移で `flushSync`×12 が同期再描画を強制。

## 5. 再開手順（そのまま実行可）

```bash
cd /Users/naokikaneko/tonihaya-calendar
git branch --show-current        # ★編集前に必ず確認（main なら下記）
git switch develop
git switch -c <type>/<名前>       # feat/|fix/|refactor/|perf/|chore/
npx vitest run && npx tsc --noEmit && npx next build   # 3点セット（185緑）
# ローカル実機: python3 -m http.server 4599 --directory out → Playwright/ブラウザ
# 本番反映: vercel inspect https://tonihaya-calendar.vercel.app | grep -i status
```

## 6. 落とし穴メモ（このセッションで踏んだ/確認した）

- **⚠️ 調査・デバッグからそのまま修正編集に入るとき、`main` に居たまま編集しがち**（perf修正で実際に踏み、未コミットのうちに `git stash`→develop で `perf/` ブランチ→`stash pop` で無傷移送）。編集前にブランチ確認。→ メモリ `feedback-branch-before-edit`。
- **UI変更はローカル実機確認前提**。today/祝日/和暦は**クライアント描画**で SSR HTML に実値が出ない → 反映確認は Playwright 実描画（`curl` grep 不可）。px単位の微調整はローカルで反復。
- **祝日計算はキャッシュ済**（`holiday.ts`）。今後セル毎に `getHoliday`/`isHoliday` を増やしても年キャッシュが効くので低コスト。
- ローカル `python http.server` はキャッシュが弱く古い build を返すことがある → 確認時は**ハードリロード**（Cmd+Shift+R）。
- `next dev` 起動中に `next build` しない（`.next` 共有事故）。
