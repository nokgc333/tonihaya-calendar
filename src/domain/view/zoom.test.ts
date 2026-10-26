import { describe, expect, test } from "vitest";
import { parseZoom, zoomToQuery } from "./zoom";

const P = (q: string) => new URLSearchParams(q);

describe("parseZoom", () => {
  test("y only is overview", () => {
    expect(parseZoom(P("y=2026"), 2000)).toEqual({
      level: "overview",
      year: 2026,
    });
  });
  test("y and m is month", () => {
    expect(parseZoom(P("y=2026&m=7"), 2000)).toEqual({
      level: "month",
      year: 2026,
      month: 7,
    });
  });
  test("no params gives overview of the fallback year", () => {
    expect(parseZoom(P(""), 2000)).toEqual({ level: "overview", year: 2000 });
  });
  test("y is clamped to the range", () => {
    expect(parseZoom(P("y=1000"), 2000)).toEqual({
      level: "overview",
      year: 1950,
    });
  });
  test("an invalid month falls back to overview", () => {
    expect(parseZoom(P("y=2026&m=13"), 2000)).toEqual({
      level: "overview",
      year: 2026,
    });
  });
  test("m without y gives month of the fallback year", () => {
    expect(parseZoom(P("m=7"), 2000)).toEqual({
      level: "month",
      year: 2000,
      month: 7,
    });
  });
  test("y m d v=week is week", () => {
    expect(parseZoom(P("y=2026&m=7&d=5&v=week"), 2000)).toEqual({
      level: "week",
      year: 2026,
      month: 7,
      day: 5,
    });
  });
  test("y m d v=day is day", () => {
    expect(parseZoom(P("y=2026&m=7&d=5&v=day"), 2000)).toEqual({
      level: "day",
      year: 2026,
      month: 7,
      day: 5,
    });
  });
  test("d without v is ignored and falls back to month", () => {
    expect(parseZoom(P("y=2026&m=7&d=5"), 2000)).toEqual({
      level: "month",
      year: 2026,
      month: 7,
    });
  });
  test("an invalid day (32) falls back to month", () => {
    expect(parseZoom(P("y=2026&m=7&d=32&v=week"), 2000)).toEqual({
      level: "month",
      year: 2026,
      month: 7,
    });
  });
});

describe("zoomToQuery", () => {
  test("overview has y only", () => {
    expect(zoomToQuery({ level: "overview", year: 2026 })).toBe("?y=2026");
  });
  test("month has y and m", () => {
    expect(zoomToQuery({ level: "month", year: 2026, month: 7 })).toBe(
      "?y=2026&m=7",
    );
  });
  test("week has y m d v", () => {
    expect(zoomToQuery({ level: "week", year: 2026, month: 7, day: 5 })).toBe(
      "?y=2026&m=7&d=5&v=week",
    );
  });
  test("day has y m d v", () => {
    expect(zoomToQuery({ level: "day", year: 2026, month: 7, day: 5 })).toBe(
      "?y=2026&m=7&d=5&v=day",
    );
  });
});
