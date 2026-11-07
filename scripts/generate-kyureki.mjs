#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import * as Astronomy from "astronomy-engine";

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MONTHS_PER_YEAR = 12;
const PRINCIPAL_TERM_STEP = 30;
const FULL_CIRCLE = 360;
const WINTER_SOLSTICE = 270;
const SOLSTICE_MONTH = 11;
const NEW_MOON = 0;
const SEARCH_DAYS = 40;
const YEAR_SEARCH_DAYS = 366;
const SEARCH_START_MONTH = 9;
const SEARCH_END_MONTH = 3;
const SHORT_MONTH_DAYS = 29;

function newMoonDays(start, end, civilDay) {
  const first = Astronomy.SearchMoonPhase(NEW_MOON, start, SEARCH_DAYS);
  if (first === null) throw new Error("New moon not found");
  let quarter = new Astronomy.MoonQuarter(NEW_MOON, first);
  const days = [];
  while (quarter.time.date < end) {
    if (quarter.quarter === NEW_MOON) days.push(civilDay(quarter.time));
    quarter = Astronomy.NextMoonQuarter(quarter);
  }
  return days;
}

function principalTerms(firstYear, lastYear, civilDay) {
  const terms = [];
  for (let year = firstYear - 1; year <= lastYear + 1; year += 1) {
    for (let lon = 0; lon < FULL_CIRCLE; lon += PRINCIPAL_TERM_STEP) {
      const time = Astronomy.SearchSunLongitude(
        lon,
        new Date(Date.UTC(year, 0, 1)),
        YEAR_SEARCH_DAYS,
      );
      if (time === null) throw new Error("Principal term not found");
      terms.push({ day: civilDay(time), lon });
    }
  }
  return terms.sort((a, b) => a.day - b.day);
}

function numberMonths(months) {
  const solstices = months.flatMap((month, i) =>
    month.terms.includes(WINTER_SOLSTICE) ? [i] : [],
  );
  for (let i = 0; i < solstices.length - 1; i += 1) {
    const start = solstices[i];
    const end = solstices[i + 1];
    const count = end - start;
    if (count !== MONTHS_PER_YEAR && count !== MONTHS_PER_YEAR + 1) {
      throw new Error("Invalid solstice interval");
    }
    const leapIndex =
      count === MONTHS_PER_YEAR + 1
        ? months.findIndex(
            (month, j) => j > start && j < end && month.terms.length === 0,
          )
        : -1;
    if (count === MONTHS_PER_YEAR + 1 && leapIndex === -1) {
      throw new Error("Leap month not found");
    }
    let number = SOLSTICE_MONTH;
    for (let j = start; j < end; j += 1) {
      const leap = j === leapIndex;
      if (j > start && !leap) number = (number % MONTHS_PER_YEAR) + 1;
      Object.assign(months[j], { number, leap });
    }
  }
}

export function buildKyurekiRows({
  offsetHours = 9,
  firstYear = 1949,
  lastYear = 2150,
} = {}) {
  const civilDay = (time) =>
    Math.floor((time.date.getTime() + offsetHours * MS_PER_HOUR) / MS_PER_DAY);
  const start = new Date(Date.UTC(firstYear - 1, SEARCH_START_MONTH, 1));
  const end = new Date(Date.UTC(lastYear + 2, SEARCH_END_MONTH, 1));
  const moons = newMoonDays(start, end, civilDay);
  const terms = principalTerms(firstYear, lastYear, civilDay);
  const months = moons.slice(0, -1).map((day, i) => ({
    day,
    length: moons[i + 1] - day,
    terms: terms
      .filter((term) => term.day >= day && term.day < moons[i + 1])
      .map((term) => term.lon),
    number: 0,
    leap: false,
  }));
  numberMonths(months);
  const newYears = months.flatMap((month, i) =>
    month.number === 1 && !month.leap ? [i] : [],
  );
  return newYears.slice(0, -1).flatMap((start, i) => {
    const year = new Date(months[start].day * MS_PER_DAY).getUTCFullYear();
    if (year < firstYear || year > lastYear) return [];
    const yearMonths = months.slice(start, newYears[i + 1]);
    if (
      yearMonths.some(
        (month) =>
          month.length !== SHORT_MONTH_DAYS &&
          month.length !== SHORT_MONTH_DAYS + 1,
      )
    ) {
      throw new Error("Invalid lunar month length");
    }
    return [
      {
        year,
        newYearOffset: months[start].day - Date.UTC(year, 0, 1) / MS_PER_DAY,
        leapMonth: yearMonths.find((month) => month.leap)?.number ?? 0,
        longMonths: yearMonths.map(
          (month) => month.length === SHORT_MONTH_DAYS + 1,
        ),
      },
    ];
  });
}

export function renderKyurekiTable(rows) {
  const lines = rows.map(({ newYearOffset, leapMonth, longMonths }) => {
    const bits = longMonths.reduce(
      (value, long, i) => value + (long ? 2 ** i : 0),
      0,
    );
    return `  [${newYearOffset}, ${leapMonth}, ${bits}],`;
  });
  return (
    "// Generated file. Do not edit. Regenerate: npm run generate:kyureki\n" +
    "// Bit i (LSB first) is 1 when month i in calendar order has 30 days.\n" +
    `export const KYUREKI_FIRST_YEAR = ${rows[0].year};\n\n` +
    "export const KYUREKI_ROWS: readonly (readonly [number, number, number])[] = [\n" +
    lines.join("\n") +
    "\n];\n"
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const offsetArg = process.argv.find((arg) => arg.startsWith("--offset="));
  const offsetHours =
    offsetArg === undefined ? 9 : Number(offsetArg.split("=")[1]);
  if (!Number.isFinite(offsetHours)) throw new Error("Invalid offset");
  const write = process.argv.includes("--write");
  if (write && offsetHours !== 9)
    throw new Error("Only JST tables can be written");
  const source = renderKyurekiTable(buildKyurekiRows({ offsetHours }));
  if (write) {
    const directory = new URL("../src/domain/kyureki/", import.meta.url);
    mkdirSync(directory, { recursive: true });
    writeFileSync(new URL("table.ts", directory), source);
  } else {
    process.stdout.write(source);
  }
}
