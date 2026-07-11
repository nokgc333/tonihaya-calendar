# 設計: CI導入（GitHub Actions＋LHCI速度ガード）

| 項目 | 値 |
|------|---|
| 作成日 | 2026-07-11 |
| ステータス | 草案（レビュー待ち） |
| 対象 | tonihaya-calendar / 継続的インテグレーション基盤 |
| 関連 | 3点セット（vitest / tsc / next build）、`scripts/lighthouse.mjs`（手元計測・本番URL用）、`engines.node >=22` |
| 決定経緯 | 案B（正しさゲート＋サイズ予算ブロック・スコアはwarn）× 案ア（PR＋develop/mainのpush）× 案①（ガードレール＝ベースライン×1.15） |

> 本書はブレインストーミング（案B / 案ア / 案①）で確定した方針を仕様化したもの。予算の実数値は実装時に `out/` の実測（LHCIの転送バイト）で確定する。

## 1. 目的とスコープ

**目的**: 変更ごとに「正しさ（テスト・型・ビルド）」と「速度（バンドルサイズ回帰）」を自動検証し、以降の機能追加（複数日バー等）で品質・速度が劣化しない安全網を張る。プロダクト軸「とにかく速い」を機械的にガードする。

**スコープ（入れる）**
- GitHub Actions ワークフロー1本（`ci.yml`）／2ジョブ（`verify` / `lighthouse`）
- `verify`（ブロッキング）: type-check → test → build → `out/` を artifact 化
- `lighthouse`（`needs: verify`）: LHCI で `out/` を計測
  - サイズ予算アサーション = **error（ブロッキング）**
  - Performance スコア = **warn（非ブロッキング・可視化のみ）**
- Node バージョン統一（`.nvmrc` = 22）
- 付随: `.lighthouserc.json`、`package.json`（devDep `@lhci/cli`）、`.gitignore` 追記

**スコープ外（将来）**
- Lighthouse スコアのブロッキング化（中央値N回で締める・案C相当）
- CD（デプロイは既存の Vercel GitHub 連携が担う。CI はデプロイしない）
- E2E（Playwright）の CI 実行（現状は手元 MCP 運用。将来 C 系で別途検討）
- 依存脆弱性スキャン（Dependabot 等）・カバレッジレポートのアップロード
- **ESLint / `next lint` の CI 実行**（現状 ESLint 設定・依存が未導入で、`next lint` は対話セットアップを要求し CI で動かないため今回は除外）。ESLint 導入は別タスク `chore/eslint-setup` として独立 PR で行う（既存コードへの違反修正がスコープを膨らませ得るため切り離す）

## 2. 全体構成

```
.github/workflows/ci.yml   （1ワークフロー・2ジョブ）
├─ job: verify        正しさゲート（ブロッキング）
│    checkout → setup-node(22, cache:npm) → npm ci
│    → type-check → test → build → upload-artifact(out/)
└─ job: lighthouse    速度（needs: verify）
     checkout → setup-node → npm ci → download-artifact(out/)
     → npx lhci autorun（.lighthouserc.json / staticDistDir=out）
```

- `verify` が失敗すれば `lighthouse` は起動しない（fail-fast）。
- `out/` を artifact で受け渡し、**ビルドは1回**に抑える。
- `lighthouse` ジョブでも `npm ci` は必要（`@lhci/cli` を含む devDep を使うため）。

## 3. トリガ・共通設定（案ア）

```yaml
on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

- feature ブランチ（`feat/*` 等）単独 push では走らせない。PR を開いた時点と develop/main へ入る時に検証する。
- `concurrency` で同一 ref の古い実行を自動キャンセル（待ち時間・課金を節約）。
- ランナー: `ubuntu-latest`。Node: `22`（`actions/setup-node@v4` + `cache: npm`）。インストール: `npm ci`。

## 4. job: verify（ブロッキング）

実行ステップ（1つでも非0終了で PR を赤にする）:

1. `actions/checkout@v4`
2. `actions/setup-node@v4`（node-version: 22 / cache: npm）
3. `npm ci`
4. `npm run type-check`（= `tsc --noEmit`）
5. `npm run test`（= `vitest run`）
6. `npm run build`（= `next build`。`output: "export"` により `out/` を生成）
7. `actions/upload-artifact@v4`（name: `out`, path: `out/`, retention: 1日）

> 手元の3点セット（`npx vitest run && npx tsc --noEmit && npx next build`）をそのまま CI 化した構成。順序は「型→テスト→ビルド」の理解しやすい順とする（各ステップは十分速い）。lint は ESLint 未導入のため今回は含めない（§1 スコープ外参照）。

## 5. job: lighthouse（needs: verify）

### 5.1 ジョブ手順
1. `actions/checkout@v4`
2. `actions/setup-node@v4`（node-version: 22 / cache: npm）
3. `npm ci`
4. `actions/download-artifact@v4`（name: `out`, path: `out/`）
5. `npx lhci autorun`（設定は `.lighthouserc.json`）

### 5.2 `.lighthouserc.json`
```jsonc
{
  "ci": {
    "collect": {
      "staticDistDir": "out",     // LHCI が out/ を自前で静的配信（別途 http サーバ不要）
      "numberOfRuns": 3           // 中央値でランナーのノイズを低減。モバイル既定エミュレーション
    },
    "assert": {
      "assertions": {
        // ↓ 実装時に out/ 実測（下記ベースライン）× 1.15 で確定する（案①ガードレール）
        "resource-summary:script:size": ["error", { "maxNumericValue": <SCRIPT_BUDGET> }],
        "resource-summary:total:size":  ["error", { "maxNumericValue": <TOTAL_BUDGET> }],
        "categories:performance":       ["warn",  { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"  // ログに共有レポートURL。privacy懸念時は filesystem+artifact へ
    }
  }
}
```

### 5.3 予算値の確定手順（実装時）
1. `npm run build` 後、`out/` に対して一度 `lhci autorun`（または `lhci collect`）を実行し、`resource-summary:script:size` / `resource-summary:total:size` の**実測転送バイト**を採取する。
2. それぞれ **×1.15** を予算値に設定する（案①ガードレール）。
3. `.lighthouserc.json` に「ベースライン実測値と採取日」をコメントで残す（後日の判断根拠のため）。
4. 参考ベースライン（Next 表示・目安のみ／LHCI 転送量とは指標が別）: トップページ First Load JS ≈ 116 kB（共有 102 kB ＋ ページ 13.7 kB）。**予算の正はあくまで LHCI 実測**。

### 5.4 予算引き上げの運用
- 正当な機能追加で予算超過した場合は、**同一 PR 内で `.lighthouserc.json` の予算を明示的に更新**する（肥大化が履歴に残る）。予算更新はレビューで意図を確認する対象とする。

## 6. 付随変更

| ファイル | 変更 | 備考 |
|---|---|---|
| `.github/workflows/ci.yml` | 新規 | 2ジョブ構成 |
| `.lighthouserc.json` | 新規 | 予算・LHCI 設定 |
| `.nvmrc` | 新規（`22`） | 手元と CI の Node 統一 |
| `package.json` | devDep に `@lhci/cli` 追加 | 再現性のためバージョン固定。必要なら `"ci:lhci": "lhci autorun"` script |
| `.gitignore` | `.lighthouseci/` 追記 | LHCI 作業ディレクトリ |

> 既存 `scripts/lighthouse.mjs`（本番URLをモバイル手元計測）は**残す**。用途が別（本番のフィールド寄り確認）で、CI の LHCI（マージ前のローカルビルド計測）と補完関係にある。

## 7. エラー処理・失敗時の挙動

- `verify` の各ステップは非0終了でジョブを失敗させ、PR チェックを赤にする（マージブロック）。
- `lighthouse` のサイズ予算超過（error）はジョブ失敗＝マージブロック。スコア warn はジョブを失敗させず、ログ／レポートに警告表示のみ。
- LHCI 自体の環境起因失敗（Chrome 起動不可等）はジョブ失敗として表面化させる（隠蔽しない）。ubuntu-latest は Chrome 同梱のため通常は不要だが、失敗時はログで原因を追う。
- artifact の受け渡し失敗時は `lighthouse` ジョブが download で失敗し可視化される。

## 8. 検証（この機能が"効いている"ことの確認）

CI は宣言的 YAML のため単体テスト対象外。**実挙動で確認**する:

1. `feat/ci`（または `chore/ci`）ブランチで PR を開き、`verify` と `lighthouse` の両チェックが**緑**になることを確認する。
2. **ゲートが実際にブロックすることを実証**する: 一時コミットで重い import 等を足し、`resource-summary:script:size` が **error で赤**になることを確認 → revert（"予算が本当に止まる"の証拠を取る）。
3. スコア warn がログに出ること、`temporary-public-storage` の共有レポート URL がログに出ることを確認する。
4. `concurrency` の cancel-in-progress が効くこと（PR に連続 push で古い実行がキャンセルされる）を確認する。

## 9. ブランチ・コミット運用

- `develop` から `chore/ci`（または `feat/ci`）を切り、細かめコミット（`chore: CIワークフローを追加` / `chore: LHCIの速度予算を設定` 等）→ `--no-ff` で develop。
- リリース事象ではないため main マージ・タグは基本不要（CI 自体の初回導入は develop 止まりで可。必要なら区切りで develop→main）。
- commit 規約: `type: 日本語`・`Co-Authored-By` なし（repo `CLAUDE.md` 準拠）。
