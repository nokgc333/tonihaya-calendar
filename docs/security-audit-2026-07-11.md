# セキュリティ監査レポート — tonihaya-calendar

| 項目 | 値 |
|------|---|
| 監査日 | 2026-07-11 |
| 監査者 | Claude Code（Opus 4.8）による静的レビュー |
| 対象 | `main`（HEAD 時点）全ソース `src/**` ＋ 設定・依存 |
| 手法 | 全ファイル通読＋パターン走査（XSS/インジェクション/シークレット/入力検証）＋ `npm audit`（prod/dev 分離） |
| スタンス | 正直・率直優先。過大評価も過小評価もしない |

> **率直な結論を先に**: このアプリの**自作コードに、悪用可能な重大脆弱性は見つからなかった**。設計・実装のセキュリティ品質は、この種のクライアント専用静的アプリとして**明確に良好**。最大の改善余地は「セキュリティ応答ヘッダ（CSP 等）が未設定」という**多層防御の1枚が欠けている**点で、これは緊急ではないが費用対効果の高い推奨事項。以下、盛らずに詳述する。

---

## 1. 脅威モデル（この判定の前提）

正しい重大度評価には前提の共有が要る。tonihaya-calendar は：

- **完全にクライアント専用の静的サイト**（`output: "export"`）。**サーバもDBもAPIも認証もない**。
- データは**利用者自身のブラウザの localStorage** に保存（key `tonihaya.events`）。**他人のデータは存在しない**。
- 送信・受信する機密情報がない（フォーム送信先もない）。
- 第三者スクリプトは `@vercel/speed-insights`（Web Vitals計測）1つのみ。

この前提により、**古典的Web脆弱性の大半が構造的に無効化**されている：SQLインジェクション（DBなし）、認証・認可欠陥（認証なし）、CSRF（状態変更エンドポイントなし）、サーバサイドの秘密漏洩（サーバなし）、他ユーザーへの水平権限昇格（単一ユーザー）。

**残る現実的な攻撃面は実質2つ**：
1. **XSS**（悪意ある文字列が自分のUIでスクリプト実行に化ける）。
2. **供給網／依存関係**（ビルドに混入する第三者コード）。

以下はこの2軸を中心に評価する。

---

## 2. 総評（正直な採点）

| 観点 | 評価 | 根拠 |
|------|------|------|
| XSS 耐性 | **◎ 良好** | React 自動エスケープ。`dangerouslySetInnerHTML`/`innerHTML`/`eval`/`document.write` は**ゼロ**。唯一のユーザー由来リンクは二重に検証（後述） |
| 入力検証 | **◎ 良好** | URLパラメータ・年入力・localStorage 読込を、範囲チェック＋型ガード＋enumホワイトリストで厳格に検証 |
| シークレット管理 | **◎ 問題なし** | ハードコードされた鍵・トークン・パスワードは**皆無**。`process.env` 不使用。`.env`・鍵ファイルの誤コミットもなし |
| データ堅牢性 | **○ 良好** | 破損localStorageを型ガードで除外し全体クラッシュを防止。保存失敗を握りつぶさない設計 |
| 応答ヘッダ（多層防御） | **△ 未設定** | CSP・X-Content-Type-Options 等が無い（★最大の改善余地） |
| 依存関係 | **○ 実害低** | 本番依存の指摘は2件（ビルド時・非exploitable）。dev依存の24件は全て CI 専用ツールで**ブラウザに乗らない** |

---

## 3. すでに良い点（具体的に）

過小評価を避けるため、明確に良い実装を挙げる。**これらは今後も壊さないこと**が重要。

1. **XSS の第一防御が正しく効いている**
   - イベントの `title`・`note`・祝日名などは全て JSX の**テキスト子要素**として描画され、React が自動エスケープする。`src/**` に `dangerouslySetInnerHTML` は1つも無い（走査で確認）。

2. **ユーザー由来URLの二重防御**（`src/domain/event/event.ts` `isSafeUrl`）
   - `new URL()` で解析し `http:`/`https:` **のみ許可**。`javascript:`・`data:`・`vbscript:`・相対URLは弾く。
   - **保存時**（`validateEvent`）と**描画時**（`EventModal.tsx:207` `isSafeUrl(url.trim()) && (...)`）の**両方**で再検証（多層防御）。
   - 外部リンクは `target="_blank"` に対し `rel="noopener noreferrer"`（`EventModal.tsx:210-211`）を付与し、リバースタブナビングを防止。
   - **注意**: URLをリンクとして描画するのは `EventModal` の1箇所のみ。チップ/週/日ビューはタイトルをテキスト描画するだけでリンク化しない（＝攻撃面が最小）。

3. **入力パースが堅牢**
   - `parseZoom`（`src/domain/view/zoom.ts`）: URLクエリ `y/m/d/v` を `intInRange`（`Number.isInteger`＋範囲）で検証、`v` は `"week"|"day"` の**ホワイトリスト**、年は `clampYear`（1950–2150）。**悪意あるURLパラメータで不正状態に落とせない**。
   - `resolveYearInput`（`yearRange.ts`）: 非数・空・範囲外・小数を安全に処理。

4. **永続化のハードニング**（`src/data/localStorageEventRepository.ts`）
   - `read()`: `JSON.parse` を try/catch で包み、`Array.isArray` 確認後 `isStoredCalendarEvent` で**要素単位に型ガード**。1件の破損で全滅しない。
   - `write()`: `setItem` 失敗（容量超過・プライベートモード）を握りつぶさず、開発ログ＋再throw。

5. **秘密情報・PIIの外部送信がない**
   - `process.env` 不使用、ハードコード秘密なし。全処理がローカル完結（`@vercel/speed-insights` は匿名Web Vitalsのみ）。

6. **クリーンなレイヤリング**
   - `domain/**` は純関数でI/Oを持たず、副作用は `hooks`/`data` に隔離。`EventRepository` インターフェースで保存先を抽象化（テスト時に in-memory 差し替え可）。攻撃面の見通しが良い。

---

## 4. 指摘事項（重大度順・正直な評価）

> 重大度は §1 の脅威モデルに照らした**実効リスク**で付ける。CVSS 的な名目値ではなく「この構成で実際にどれだけ危ないか」。

### 🟡 M-1（Medium）: セキュリティ応答ヘッダが未設定（多層防御の欠落）

- **現状**: `vercel.json`・`public/_headers` が無く、**CSP / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / HSTS のいずれも送出していない**。
- **なぜ問題か**: 現状のXSS第一防御（Reactエスケープ＋URL検証）は良好だが、**将来 `dangerouslySetInnerHTML` や新たな外部スクリプトを1つ足した瞬間に第一防御が破れる**。CSP は「破れても実行させない」**2枚目の壁**。`X-Content-Type-Options: nosniff` はMIMEスニッフィング由来の実行を防ぐ。いずれも**バックエンド不要・静的サイトでも設定可能**（Vercelのヘッダ機能）。
- **実効リスク**: 現時点の実害は低い（＝Medium 止まり）。ただし**入れない理由がほぼ無い**安価な保険。
- **推奨**（`vercel.json` を追加）:
  ```jsonc
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://vitals.vercel-insights.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
          { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
        ]
      }
    ]
  }
  ```
  - **注意（正直に）**: `style-src 'unsafe-inline'` は現状インラインstyle（`style={{...}}`）とTailwindを許すため必要。`script-src`/`connect-src` の `va.vercel-scripts.com`/`vitals.vercel-insights.com` は Speed Insights 用。**導入後は必ず本番実機でコンソールのCSP違反と、遷移/計測が壊れていないかを確認**（CSPは締めすぎると自分の機能を壊すため、実機検証が必須）。まず `Content-Security-Policy-Report-Only` で試すのが安全。
- **工数**: 小（設定ファイル1つ＋実機検証）。

### 🟢 L-1（Low）: 依存関係の既知脆弱性（大半は dev 専用で非出荷）

- **本番依存（`--omit=dev`）**: **2件 moderate**。いずれも `next` がバンドルする `postcss`（`GHSA-qx2v-qp2m-jg93`「`</style>` 未エスケープによるCSS出力XSS」）。
  - **実効リスク: ほぼ無し**。これは**ビルド時**にCSS文字列化で起きる問題で、**攻撃者が任意のCSSソースを注入できる前提**が要る。本プロジェクトのCSSは作者管理（Tailwind＋自作 `globals.css`）で外部入力を受けない。修正は `next` のダウングレード（破壊的）しか出ず、`audit fix --force` は不適切。**現状維持＋監視**が妥当。
- **開発依存（全体）**: **24件（low2/mod21/high1）。全て `@lhci/cli`（Lighthouse CI）ツリー**（`inquirer`/`tmp`/`uuid`/`external-editor`）。
  - **実効リスク: 出荷物ゼロ**。CI・手元計測でのみ使い、**ブラウザに配信されるバンドルには一切含まれない**。「high」も CI ツール内部の話。
  - **推奨**: 定期的に `npm audit` を確認。`@lhci/cli` の後続バージョンで解消されたら追随。今すぐの `audit fix --force`（`@lhci/cli@0.1.0` へ破壊的ダウングレード）は**してはいけない**。
- **工数**: 極小（監視のみ）。

### 🟢 L-2（Low）: 保存失敗が「サイレント」（UX/堅牢性寄り）

- **現状**: `localStorage` 容量超過等で保存失敗すると、`write()` が再throw → `useEvents` の `try/catch` が**握って楽観更新をスキップ**（`useEvents.tsx:58-62`）。結果、**利用者には何のエラーも出ず、追加した予定が黙って現れない**。
- **なぜ問題か**: セキュリティというより**データ損失の可視性**。利用者が「保存したつもり」で失われる。開発ログ（`console.error`）は残るが一般利用者は見ない。
- **推奨**: 保存失敗時に**ユーザー向けのトースト/メッセージ**を出す（例: 「保存できませんでした。ブラウザの容量やプライベートモードを確認してください」）。`addEvent/updateEvent/removeEvent` の失敗を UI に伝播させる。
- **工数**: 小〜中。

### 🔵 I-1（Info）: 入力文字列に上限長がない

- `title`/`note`/`url` は長さ無制限。悪用というより、**巨大文字列で localStorage を膨張**させたり描画を重くしうる（自分でしかできないが、堅牢性の観点）。
- **推奨**: 入力に `maxLength`（例: title 200 / note 2000 / url 2048）を付与し、`validateEvent` でも上限を検査。
- **工数**: 極小。

### 🔵 I-2（Info）: localStorage は平文

- 予定の `note` に機微情報を書く利用者がいれば、同一デバイスの他者・拡張機能から読める（localStorage の性質）。**単一ユーザーのローカルアプリとしては許容範囲**だが、将来「機密メモ」用途が出るなら設計判断が要る。
- **推奨**: 現状は明記のみ（対応不要）。将来 Supabase 同期時に転送・保存の暗号化方針を検討。

### 🔵 I-3（Info）: CSP 導入時は Speed Insights を許可リストへ

- `@vercel/speed-insights` は `va.vercel-scripts.com`（スクリプト）／`vitals.vercel-insights.com`（送信先）を使う。M-1 の CSP に含める必要がある（上記例に反映済み）。SRI は自己ホストバンドルには不要、外部はこの1つのみ。

---

## 5. ファイル別・セキュリティ観点メモ

| ファイル | 観点 | 判定 |
|---------|------|------|
| `domain/event/event.ts` | `isSafeUrl`・`isStoredCalendarEvent`・`validateEvent` | ◎ 中核の防御。良好 |
| `data/localStorageEventRepository.ts` | `JSON.parse` try/catch＋型ガード＋write再throw | ◎ 堅牢 |
| `components/EventModal.tsx` | ユーザーURLのリンク描画（唯一） | ◎ `isSafeUrl`＋`rel=noopener` で二重防御 |
| `components/EventChip.tsx` / `DayTimedEvents.tsx` / `MonthCard.tsx` | title をテキスト描画 | ◎ React エスケープ。リンク化しない |
| `domain/view/zoom.ts` / `yearRange.ts` | URLパラメータ・年入力の解釈 | ◎ 範囲/型/enum で厳格 |
| `hooks/useZoomState.ts` | `history.pushState`＋`popstate` | ◎ URLは検証済み数値のみで組み立て。文字列注入なし |
| `hooks/useEvents.tsx` | 楽観更新・保存失敗ハンドリング | ○ 整合的だが失敗がサイレント（L-2） |
| `app/layout.tsx` | 第三者スクリプト（Speed Insights） | ○ 信頼ベンダ1つ。CSP許可リスト対象（I-3） |
| `app/globals.css` | 外部参照 | ◎ `@import "tailwindcss"` のみ（ビルド時インライン化）。実行時の外部取得なし |
| 全体 | シークレット・`process.env`・`.env` コミット | ◎ 皆無 |

---

## 6. 依存関係の詳細（prod と dev の切り分け）

| 区分 | 件数 | 内訳 | 出荷物に含む？ | 対応 |
|------|------|------|--------------|------|
| **本番（prod）** | 2 moderate | `postcss`（`next` 経由・ビルド時XSS advisory） | ビルド時のみ | 非exploitable。監視。強制fix禁止 |
| **開発（dev）** | 24（2/21/1） | `@lhci/cli` ツリー（inquirer/tmp/uuid/external-editor） | **含まない** | 監視。後続版で解消され次第追随 |

- 本番依存は最小（`next`/`react`/`react-dom`/`@vercel/speed-insights`）で攻撃面が小さい。
- `package-lock.json` はコミット済み（供給網の再現性◯）。CI は `npm install`（クロスプラットフォーム optional 対応のため）＝厳密固定は `npm ci` よりやや緩いが、単一開発者では許容。

---

## 7. コーディング／推奨プラクティス（「書き方」面の所見）

セキュリティに資する良習慣と、上乗せ推奨。

**良い習慣（維持）**
- イミュータビリティ（`readonly`/`const`/スプレッド）を一貫使用 → 状態の予期せぬ書き換えを抑制。
- 純粋ドメイン層と副作用層の分離 → 検証すべき箇所が局所化され、監査しやすい。
- 防御的パース（型ガード・範囲チェック・ホワイトリスト）を**境界（URL・localStorage・入力）に配置**。

**上乗せ推奨**
1. **入力に上限長**（I-1）: `maxLength` ＋ `validateEvent` の長さ検査。
2. **保存失敗のユーザー可視化**（L-2）: サイレント欠損を無くす。
3. **CSP は Report-Only から**（M-1）: 段階導入で自壊を防ぐ。
4. 将来 `dangerouslySetInnerHTML` を使う場合は **DOMPurify 等でサニタイズ必須**というルールを CLAUDE.md に明記（今は不要だが予防的ガードレール）。
5. 依存追加時は `npm audit` と**出荷物への影響（prod/dev）を確認**する運用を継続。

---

## 8. 推奨アクション優先順位

| # | 項目 | 重大度 | 工数 | 推奨時期 |
|---|------|--------|------|---------|
| 1 | セキュリティ応答ヘッダ（`vercel.json`・まず Report-Only の CSP） | Medium | 小 | 近いうちに（単独chore） |
| 2 | 保存失敗のユーザー可視化 | Low | 小〜中 | イベントUI改善の折に |
| 3 | 入力の `maxLength`＋長さ検証 | Info | 極小 | ついでに |
| 4 | 依存脆弱性の定期監視（prod/dev 切り分け） | Low | 極小 | 継続運用 |
| 5 | localStorage 平文の明記（将来の同期設計で暗号化検討） | Info | ― | Supabase 同期時 |

> **繰り返しの率直な結論**: 今すぐ塞ぐべき「穴」は無い。自作コードのセキュリティ実装はこの規模のアプリとして上位。やるなら **#1（ヘッダ）** が最も費用対効果が高く、残りは機能開発の折についでに回収すれば十分。

---

*本レポートは静的レビュー（コード通読＋パターン走査＋依存監査）に基づく。動的検査（実際のペネトレーションテスト・ヘッダの本番実測・CSP違反の実機確認）は未実施。特に §4 M-1 の CSP は導入後に本番実機での検証を必須とする。*
