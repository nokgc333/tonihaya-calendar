import { describe, expect, it } from "vitest";
import { initialGridIndex, nextGridIndex } from "@/components/dayGridNav";

const COLUMNS = 7;
const TOTAL = 42;

describe("nextGridIndex", () => {
  it.each([
    ["ArrowRight", 10, 11],
    ["ArrowLeft", 10, 9],
    ["ArrowDown", 10, 17],
    ["ArrowUp", 10, 3],
  ])("moves by %s from %i to %i", (key, from, to) => {
    expect(nextGridIndex(key, from, TOTAL, COLUMNS)).toBe(to);
  });

  it("goes on to the next row after the last day of a row, and back to the previous row", () => {
    expect(nextGridIndex("ArrowRight", 6, TOTAL, COLUMNS)).toBe(7);
    expect(nextGridIndex("ArrowLeft", 7, TOTAL, COLUMNS)).toBe(6);
  });

  it("stays at the first and the last day of the grid", () => {
    expect(nextGridIndex("ArrowLeft", 0, TOTAL, COLUMNS)).toBe(0);
    expect(nextGridIndex("ArrowUp", 3, TOTAL, COLUMNS)).toBe(3);
    expect(nextGridIndex("ArrowRight", 41, TOTAL, COLUMNS)).toBe(41);
    expect(nextGridIndex("ArrowDown", 38, TOTAL, COLUMNS)).toBe(38);
  });

  it("goes to the first and the last day of the row with Home and End", () => {
    expect(nextGridIndex("Home", 10, TOTAL, COLUMNS)).toBe(7);
    expect(nextGridIndex("End", 10, TOTAL, COLUMNS)).toBe(13);
    expect(nextGridIndex("Home", 7, TOTAL, COLUMNS)).toBe(7);
    expect(nextGridIndex("End", 13, TOTAL, COLUMNS)).toBe(13);
  });

  it("stays inside the grid when it has fewer rows", () => {
    expect(nextGridIndex("ArrowDown", 30, 35, COLUMNS)).toBe(30);
    expect(nextGridIndex("ArrowRight", 34, 35, COLUMNS)).toBe(34);
  });

  it("ends the last row at the last day when that row is short", () => {
    expect(nextGridIndex("End", 36, 38, COLUMNS)).toBe(37);
    expect(nextGridIndex("End", 35, 38, COLUMNS)).toBe(37);
  });

  it("leaves other keys alone", () => {
    expect(nextGridIndex("a", 10, TOTAL, COLUMNS)).toBeNull();
    expect(nextGridIndex("Tab", 10, TOTAL, COLUMNS)).toBeNull();
    expect(nextGridIndex("Enter", 10, TOTAL, COLUMNS)).toBeNull();
  });
});

describe("initialGridIndex", () => {
  const cell = (inMonth: boolean, isToday = false) => ({ inMonth, isToday });

  it("starts on today when it is in the month", () => {
    expect(
      initialGridIndex([cell(false), cell(true), cell(true, true), cell(true)]),
    ).toBe(2);
  });

  it("starts on the first day of the month when today is not in it", () => {
    expect(
      initialGridIndex([cell(false), cell(false), cell(true), cell(true)]),
    ).toBe(2);
  });

  it("ignores a today that belongs to a neighboring month", () => {
    expect(initialGridIndex([cell(false, true), cell(true), cell(true)])).toBe(
      1,
    );
  });

  it("starts on the first cell when nothing is in the month", () => {
    expect(initialGridIndex([cell(false), cell(false)])).toBe(0);
  });
});
