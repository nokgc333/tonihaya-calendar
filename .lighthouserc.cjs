// tonihaya-calendar LHCI 設定（PR/CI の速度ガード）。
// 速度予算は「実測ベースライン × 1.15」のガードレール（設計書 §5・案①）。
// ベースライン実測（out/index.html 転送バイト・2026-07-11 計測 / Lighthouse mobile）:
//   script(total JS transfer) = 119872 B  -> budget 138240 B
//   total (page transfer)     = 133011 B  -> budget 153600 B
//   （参考: 404.html は script 105287 B / total 114959 B と index より小さく同予算を通過）
// 予算を引き上げる場合は同一 PR でこの値を明示更新すること（肥大化を履歴に残す）。
module.exports = {
  ci: {
    collect: {
      staticDistDir: "out", // LHCI が out/ を自前で静的配信（別途 http サーバ不要）
      numberOfRuns: 3, // 中央値でランナーのノイズを低減（モバイル既定エミュレーション）
    },
    assert: {
      assertions: {
        "resource-summary:script:size": ["error", { maxNumericValue: 138240 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 153600 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage", // ログに共有レポート URL を出す
    },
  },
};
