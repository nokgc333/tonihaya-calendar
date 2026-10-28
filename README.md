# tonihaya-calendar

12 か月を一望できる、とにかく速い日本語向けのカレンダー。年 → 月 → 週 → 日とズームでき、祝日・和暦・和風月名・カウントダウン・予定の管理を備える。ブラウザだけで動き、データは端末の `localStorage` に保存する(サーバーには送らない)。

本番: https://tonihaya-calendar.vercel.app

## できること

| 分類 | 内容 |
| --- | --- |
| 表示 | 年(12 か月、3×4 / 4×3 の配置)、月、週、日。日付は URL(`?y=2026&m=7&d=15&v=day`)に入るので、リンクの共有・ブラウザの戻る進むが使える |
| 日本の暦 | 祝日(振替休日・国民の休日を含む)、和暦、和風月名、土日の色分け |
| カウントダウン | 次の土曜まで、残り営業日(今日を含まない)、月末まで、年末まで |
| 予定 | 終日・時間指定・複数日。色 8 種、優先度、リンク、備考。作成・編集・削除、再読み込み後も残る |
| 設定 | 週の開始(日曜 / 月曜)、年表示の配置。ライト / ダークはシステム設定に従う |
| 操作 | キーボードだけで全操作が可能(月の日付は矢印キー・Home・End、Esc で戻る)。スキップリンク、状態の読み上げ、動きを減らす設定に対応 |

## 動かす

必要なもの: Node.js 22(`.nvmrc`)、npm。

```bash
git clone https://github.com/nokgc333/tonihaya-calendar.git
cd tonihaya-calendar
nvm use
npm install
npm run dev
```

開発サーバーは http://localhost:3000 で開く。`npm install` は、コミット前の検査(husky)も自動で設定する。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 静的書き出し(`out/`)。書き出し後に、ページ内のスクリプトを外部ファイルへ移す |
| `npm run check` | lint、型、整形、単体テストをまとめて実行 |
| `npm run lint` / `type-check` / `format:check` | 個別の検査(lint は警告 0 件が条件) |
| `npm run format` | 整形(ファイルを書き換える) |
| `npm run check:duplicates` | 重複コードの検査(0 件が条件) |
| `npm test` / `npm run test:coverage` | 単体テスト / カバレッジつき(閾値 95%) |
| `npm run test:e2e` | E2E(Playwright。初回は `npx playwright install chromium`)。axe によるアクセシビリティ検査を含む |
| `npm run test:mutation` | ドメイン層のミューテーションテスト(約 10〜20 分。毎週月曜に CI でも実行) |
| `npm run lighthouse [URL]` | Lighthouse(モバイル)。URL を省略すると本番 |
| `npm run ci:lhci` | Lighthouse CI(サイズ予算と性能の判定。先に `npm run build`) |
| `npm run check:headers -- <URL>` | デプロイしたサイトのヘッダーと、インラインスクリプトが無いことの確認 |
| `npm run check:site [URL]` | デプロイしたサイトの主要導線・ポリシー違反・メタ情報・ファイルの確認 |
| `npm run generate:images` | 共有画像とアイコンの再生成(`npm run build` の後に実行) |
| `npm run secrets` | リポジトリ全体の秘密情報の検査 |

## 品質の基準

CI(GitHub Actions)がプルリクエストごとに確認する。

| 項目 | 基準 |
| --- | --- |
| 静的検査 | lint 警告 0、型エラー 0、整形済み、重複コード 0、関数 80 行以内・ファイル 250 行以内・複雑度 10 以内 |
| テスト | 単体テスト(カバレッジ 4 指標とも 95% 以上)、E2E、ドメイン層のミューテーションスコア 85% 以上(毎週) |
| 速度 | スクリプト 162 KiB、ページ合計 184 KiB 以内(Next.js 16 の実測に、数 % の余裕を足した値。15 のときは 128 / 150 KiB)。CLS 0.05 以下、性能スコア 90 以上、LCP 2.5 秒以下(警告) |
| アクセシビリティ | axe の違反 0(予定を全 8 色で入れた全画面、ライト・ダーク) |
| セキュリティ | 本番依存の脆弱性(high 以上)0、追加された依存のレビュー、CodeQL、秘密情報の検査 |

## 構成

```
src/
  app/            ページ、メタデータ、robots・sitemap・manifest、スタイル(テーマ変数)
  components/     機能ごとのフォルダ: calendar、year、month、week、day、timeline、event、common
  domain/         日付・暦・祝日・和暦・カウントダウン・予定・各ビューの計算(UI に依存しない)
  data/           予定の保存(localStorage、版つきの形式、壊れたデータの退避)
  hooks/          状態を持つフック
e2e/              E2E(Playwright)
scripts/          ビルド後の処理、確認用スクリプト
tests/            設定のテスト、テスト用の道具、旧形式のデータの見本
docs/             要件定義書、仕様書、設計、デプロイの手順書、ドメイン層の公開関数の一覧
```

ドメイン層の公開関数は [`docs/domain-api.md`](./docs/domain-api.md) にまとめている。components の依存の向きは、`tests/project/structure.test.ts` が固定している(`common` は他へ依存しない、など)。

## 保存データ

予定は `localStorage` の `tonihaya.events` に `{ "version": 1, "events": [...] }` の形で保存する。初版の形式(予定の配列だけ)は、読み込み時に自動で移行する。

| キー | 内容 |
| --- | --- |
| `tonihaya.events.legacy-v0` | 移行前の旧形式の控え |
| `tonihaya.events.backup` | 壊れていた・巨大だった・新しい版だったデータの控え(初期化の前に退避) |
| `tonihaya.events.rejected` | 使えなかった予定と理由(最新 100 件) |

上限は 5,000 件・200 万文字。

## ブランチとデプロイ

`feature` → `develop` → `main` の順にマージ(マージコミット)する。`main` へのマージで、Vercel が本番へデプロイする。デプロイ後の確認は [`docs/deploy-checklist.md`](./docs/deploy-checklist.md) の手順で行う。

## セキュリティヘッダー

`vercel.json` で、`script-src 'self'`(インラインスクリプトなし)、`frame-ancestors 'none'`、COOP / CORP、HSTS などを設定している。静的書き出しのページに残る小さなインラインスクリプトは、ビルドの最後に外部ファイルへ移す。

## ライセンス

MIT License。[`LICENSE`](./LICENSE) を参照。
