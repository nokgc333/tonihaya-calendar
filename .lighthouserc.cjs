module.exports = {
  ci: {
    collect: {
      staticDistDir: "out",
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "resource-summary:script:size": ["error", { maxNumericValue: 138240 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 153600 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
