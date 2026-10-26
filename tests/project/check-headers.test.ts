import { describe, expect, it } from "vitest";

import {
  compareHeaders,
  findInlineScripts,
} from "../../scripts/check-headers.mjs";

const expected = { "X-A": "1", "Content-Security-Policy": "script-src 'self'" };

describe("compareHeaders", () => {
  it("reports nothing when every expected header is there with its value", () => {
    expect(
      compareHeaders(
        expected,
        new Headers({
          "x-a": "1",
          "content-security-policy": "script-src 'self'",
        }),
      ),
    ).toEqual([]);
  });

  it("matches the header names without regard to case", () => {
    expect(compareHeaders({ "X-A": "1" }, new Headers({ "X-a": "1" }))).toEqual(
      [],
    );
  });

  it("reports a missing header", () => {
    expect(compareHeaders(expected, new Headers({ "x-a": "1" }))).toEqual([
      "Content-Security-Policy is missing",
    ]);
  });

  it("reports a header whose value differs, with both values", () => {
    expect(compareHeaders({ "X-A": "1" }, new Headers({ "x-a": "2" }))).toEqual(
      ["X-A is '2' but should be '1'"],
    );
  });

  it("does not mind headers that were not expected", () => {
    expect(
      compareHeaders(
        { "X-A": "1" },
        new Headers({ "x-a": "1", server: "Vercel" }),
      ),
    ).toEqual([]);
  });
});

describe("findInlineScripts", () => {
  it("finds scripts without a src", () => {
    expect(
      findInlineScripts("<script>a()</script><script src='/x.js'></script>"),
    ).toHaveLength(1);
  });

  it("finds none when every script has a src", () => {
    expect(findInlineScripts('<script src="/a.js" async=""></script>')).toEqual(
      [],
    );
  });

  it("ignores data blocks that are not JavaScript", () => {
    expect(
      findInlineScripts('<script type="application/json">{}</script>'),
    ).toEqual([]);
  });
});
