# デプロイの確認手順

本番は `main` へのマージで Vercel が自動でデプロイする。毎回、次の順で確認する。

## 1. マージの前

- [ ] `develop` → `main` の PR で、CI がすべて成功している(verify、e2e、lighthouse、audit、dependency review、CodeQL)
- [ ] 見た目に関わる変更なら、`npm run build` の後に `node scripts/serve-out.mjs 3100` で開いて確認する(本番と同じヘッダーを返す静的サーバー)
- [ ] マージコミットで取り込む(squash・rebase はしない)

## 2. マージの後

- [ ] `develop` を `main` に揃える(個人開発のルール)

```bash
git switch main && git pull && git switch develop && git merge --ff-only main && git push
```

- [ ] Vercel の本番デプロイが `success` になるまで待つ

```bash
SHA=$(git rev-parse HEAD)
gh api "repos/nokgc333/tonihaya-calendar/deployments?sha=$SHA&environment=Production" --jq '.[0].id' \
  | xargs -I{} gh api repos/nokgc333/tonihaya-calendar/deployments/{}/statuses --jq '.[0].state'
```

## 3. 本番の確認(上から順に。どれかが失敗したら、5 の手順で戻す)

| # | コマンド | 通る条件 |
| --- | --- | --- |
| 1 | `npm run check:headers -- https://tonihaya-calendar.vercel.app` | `vercel.json` のヘッダーがすべて付いていて、ページにインラインスクリプトが無い |
| 2 | `npm run check:site` | 年表示に 12 か月が出る、予定フォームが開く、ポリシー違反とコンソールエラーが 0、canonical・og 画像・manifest・JSON-LD がある、robots・sitemap・manifest・画像・アイコンが 200 |
| 3 | `npm run lighthouse` | 性能 90 以上、CLS 0.05 以下、LCP 2.5 秒以下(3 回測って中央値を見る) |

- [ ] ブラウザで本番を開き、年 → 月 → 週 → 日と、予定の追加・編集・削除、再読み込み後の保存を一通り操作する
- [ ] 共有時の見え方(タイトル・説明・画像)を、共有デバッガーで確認する(X の Card Validator、Facebook のシェアデバッガーなど)。画像を変えたときは、デバッガー側のキャッシュを更新する

## 4. プレビューデプロイについて

PR ごとの Vercel のプレビューは、ログイン(SSO)で保護されていて、スクリプトから検査できない(認証の回避はしない)。このため、次のように分けている。

- ヘッダー・メタ情報・性能・アクセシビリティ: CI が、ビルドした `out/` を `vercel.json` と同じヘッダーを返すサーバーで検査する(E2E、Lighthouse CI)
- 実際の Vercel 上での確認: 本番へ反映した後に、上の 3 で行う

プレビューに対して Lighthouse CI を走らせる案は、保護のために見送った。保護を外す場合に限り、再検討する。

## 5. 問題があったとき

1. 直前の `develop` → `main` のマージを、`git revert -m 1 <マージコミット>` で打ち消す PR を作り、CI が通ったらマージする(本番が元に戻る)
2. 本番が空白になるなど急ぐ場合は、`vercel.json` の `script-src 'self'` を `script-src 'self' 'unsafe-inline'` に変える PR を先に出す(1 行の変更)。原因を直したら戻す
3. 原因と対処を、Vault の Knowledge に記録する

## 6. バージョンを上げるとき

- [ ] `package.json` の `version` を上げる
- [ ] README の「できること」「スクリプト」「品質の基準」が、変更と合っているか確認する
- [ ] `docs/` の設計・仕様に影響する変更なら、該当の文書も更新する
