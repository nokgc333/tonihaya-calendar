import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EVENT_COLOR_KEYS, eventColor } from "@/components/eventColors";
import { dayBgColor, dayTextColor } from "@/components/dayPalette";
import { SIZE } from "@/components/monthCardSize";
import { WEEKDAY_JA } from "@/components/weekdays";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");
const defined = (name: string): boolean => new RegExp(`${name}\\s*:`).test(css);
const variableOf = (reference: string): string =>
  /var\((--[a-z-]+)\)/.exec(reference)![1];

describe("event colors", () => {
  it("has eight color keys without duplicates", () => {
    expect(EVENT_COLOR_KEYS).toHaveLength(8);
    expect(new Set(EVENT_COLOR_KEYS).size).toBe(8);
  });

  it.each(EVENT_COLOR_KEYS)(
    "%s refers to variables that the stylesheet defines",
    (key) => {
      const color = eventColor(key);
      for (const reference of [color.bg, color.fg, color.border]) {
        expect(defined(variableOf(reference)), reference).toBe(true);
      }
    },
  );

  it.each(EVENT_COLOR_KEYS)(
    "%s has its own variables, not those of another color",
    (key) => {
      const color = eventColor(key);
      expect(color.bg).toBe(`var(--ev-${key}-bg)`);
      expect(color.fg).toBe(`var(--ev-${key}-fg)`);
      expect(color.border).toBe(`var(--ev-${key}-border)`);
    },
  );
});

describe("day palette", () => {
  const kinds = [
    {
      name: "ordinary",
      isSunday: false,
      isSaturday: false,
      isHoliday: false,
      text: "var(--text)",
      bg: "var(--surface)",
    },
    {
      name: "Sunday",
      isSunday: true,
      isSaturday: false,
      isHoliday: false,
      text: "var(--accent-red)",
      bg: "var(--sun-bg)",
    },
    {
      name: "Saturday",
      isSunday: false,
      isSaturday: true,
      isHoliday: false,
      text: "var(--accent-sat)",
      bg: "var(--sat-bg)",
    },
    {
      name: "holiday on a weekday",
      isSunday: false,
      isSaturday: false,
      isHoliday: true,
      text: "var(--holiday-text)",
      bg: "var(--surface)",
    },
    {
      name: "holiday on a Sunday",
      isSunday: true,
      isSaturday: false,
      isHoliday: true,
      text: "var(--holiday-text)",
      bg: "var(--sun-bg)",
    },
    {
      name: "holiday on a Saturday",
      isSunday: false,
      isSaturday: true,
      isHoliday: true,
      text: "var(--holiday-text)",
      bg: "var(--sat-bg)",
    },
  ];

  it.each(kinds)(
    "colors the text of a $name",
    ({ name: _name, text, ...day }) => {
      expect(dayTextColor(day)).toBe(text);
    },
  );

  it.each(kinds)(
    "tints the background of a $name",
    ({ name: _name, bg, ...day }) => {
      expect(dayBgColor(day)).toBe(bg);
    },
  );

  it.each(kinds)(
    "uses only variables that the stylesheet defines for a $name",
    ({ name: _name, text, bg }) => {
      for (const reference of [text, bg]) {
        expect(defined(variableOf(reference)), reference).toBe(true);
      }
    },
  );
});

describe("shared display constants", () => {
  it("lists the weekdays from Sunday", () => {
    expect(WEEKDAY_JA).toEqual(["日", "月", "火", "水", "木", "金", "土"]);
  });

  it("gives the large month card taller rows and larger text than the small one", () => {
    expect(parseFloat(SIZE.lg.row)).toBeGreaterThan(parseFloat(SIZE.sm.row));
    expect(SIZE.lg.dayText).not.toBe(SIZE.sm.dayText);
  });
});
