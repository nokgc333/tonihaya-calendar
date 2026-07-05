import { describe, expect, test } from "vitest";
import { parseZoom, zoomToQuery } from "./zoom";

const P = (q: string) => new URLSearchParams(q);

describe("parseZoom", () => {
  test("y のみは overview", () => {
    expect(parseZoom(P("y=2026"), 2000)).toEqual({ level: "overview", year: 2026 });
  });
  test("y と m は month", () => {
    expect(parseZoom(P("y=2026&m=7"), 2000)).toEqual({ level: "month", year: 2026, month: 7 });
  });
  test("パラメータ無しは fallback 年の overview", () => {
    expect(parseZoom(P(""), 2000)).toEqual({ level: "overview", year: 2000 });
  });
  test("y は範囲クランプ", () => {
    expect(parseZoom(P("y=1000"), 2000)).toEqual({ level: "overview", year: 1950 });
  });
  test("不正な月は overview に落ちる", () => {
    expect(parseZoom(P("y=2026&m=13"), 2000)).toEqual({ level: "overview", year: 2026 });
  });
  test("y 無し m ありは fallback 年の month", () => {
    expect(parseZoom(P("m=7"), 2000)).toEqual({ level: "month", year: 2000, month: 7 });
  });
  test("y m d v=week は week", () => {
    expect(parseZoom(P("y=2026&m=7&d=5&v=week"), 2000)).toEqual({
      level: "week",
      year: 2026,
      month: 7,
      day: 5,
    });
  });
  test("y m d v=day は day", () => {
    expect(parseZoom(P("y=2026&m=7&d=5&v=day"), 2000)).toEqual({
      level: "day",
      year: 2026,
      month: 7,
      day: 5,
    });
  });
  test("v が無い d は無視され month に落ちる", () => {
    expect(parseZoom(P("y=2026&m=7&d=5"), 2000)).toEqual({
      level: "month",
      year: 2026,
      month: 7,
    });
  });
  test("不正な日(32)は month に落ちる", () => {
    expect(parseZoom(P("y=2026&m=7&d=32&v=week"), 2000)).toEqual({
      level: "month",
      year: 2026,
      month: 7,
    });
  });
});

describe("zoomToQuery", () => {
  test("overview は y のみ", () => {
    expect(zoomToQuery({ level: "overview", year: 2026 })).toBe("?y=2026");
  });
  test("month は y と m", () => {
    expect(zoomToQuery({ level: "month", year: 2026, month: 7 })).toBe("?y=2026&m=7");
  });
  test("week は y m d v", () => {
    expect(zoomToQuery({ level: "week", year: 2026, month: 7, day: 5 })).toBe(
      "?y=2026&m=7&d=5&v=week",
    );
  });
  test("day は y m d v", () => {
    expect(zoomToQuery({ level: "day", year: 2026, month: 7, day: 5 })).toBe(
      "?y=2026&m=7&d=5&v=day",
    );
  });
});
