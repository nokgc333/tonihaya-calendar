module.exports = {
  ci: {
    collect: {
      staticDistDir: "out",
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "resource-summary:script:size": ["error", { maxNumericValue: 131072 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 145408 }],
        "categories:performance": ["error", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
