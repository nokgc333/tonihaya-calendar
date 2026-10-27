# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「とにかく速いカレンダーアプリ」。12ヶ月分のカレンダーを俯瞰できる高速Webアプリ（将来的にiOSアプリ化）。
差別化はパフォーマンス速度 + 使いたくなる機能・UI/UX。元になっているのは日常使いのExcelプロジェクト
`12months-calendar.xlsx` と、参考にした https://www.benri.com/calendar/ 。

- 要件定義書・仕様書は `docs/` 配下に格納する（`/requirements-spec-pro` で作成）。

## 開発ルール

> 本リポジトリのコミット・ブランチ運用は、既存の `my-web` リポジトリの規約を忠実に踏襲する。

### コミットメッセージ

- `Co-Authored-By` は付けない
- 日本語スタイル: `type: 日本語の説明`
- Conventional Commits形式（feat / fix / refactor / style / chore / docs / build / perf / revert）
- 過去のコミット履歴のスタイル・分割粒度をトレースする（1つの意味単位＝1コミット、粒度は細かめ）
- subjectは命令形、先頭小文字（英語の型名）、末尾ピリオドなし

### ブランチ・PRフロー

- `feature` → `develop` → `main` の順でマージ
- `feature` → `main` への直接PRは送らない
- `main` マージで本番デプロイが走る想定

### 検証

- コード変更後は、テスト・型チェック・ビルドの3点セットで検証する（技術スタック確定後に具体化）。

### ドキュメントの更新

- 機能・スクリプト・品質の基準・保存データの形式を変えたら、同じ PR で `README.md` も更新する
- バージョンを上げるときは、`package.json` の `version` と README を合わせ、`docs/deploy-checklist.md` の手順で本番を確認する
- 公開されている README に、仮の屋号やコピーを書かない
